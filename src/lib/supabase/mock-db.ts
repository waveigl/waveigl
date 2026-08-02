import * as fs from 'fs'
import * as path from 'path'

const DB_PATH = path.resolve(process.cwd(), '.dev', 'db.json')

type Row = Record<string, unknown>
type TableData = Row[]

interface DbSchema {
  [table: string]: TableData
}

interface Filter {
  type: 'eq' | 'neq' | 'in' | 'ilike' | 'is' | 'not' | 'gte' | 'lte' | 'or'
  col?: string
  val?: unknown
  op?: string
  filters?: Filter[]
}

interface OrderDef {
  column: string
  ascending: boolean
  foreignTable?: string
}

interface MockResponse<T = unknown> {
  data: T | null
  error: { message: string; code: string; details: string } | null
  count: number | null
  status?: number
  statusText?: string
}

let cachedDb: DbSchema | null = null

function loadDb(): DbSchema {
  if (cachedDb) return cachedDb
  try {
    if (!fs.existsSync(DB_PATH)) {
      cachedDb = {}
      return cachedDb
    }
    const raw = fs.readFileSync(DB_PATH, 'utf-8')
    cachedDb = JSON.parse(raw) as DbSchema
    return cachedDb
  } catch {
    cachedDb = {}
    return cachedDb
  }
}

function saveDb(): void {
  if (!cachedDb) return
  try {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify(cachedDb, null, 2), 'utf-8')
  } catch (e) {
    console.error('[MockDB] Erro ao salvar:', e)
  }
}

function getTable(table: string): TableData {
  const db = loadDb()
  if (!db[table]) db[table] = []
  return db[table]
}

function setTable(table: string, data: TableData): void {
  const db = loadDb()
  db[table] = data
  cachedDb = db
}

function generateId(): string {
  return 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9)
}

function matchesFilter(record: Row, filter: Filter): boolean {
  const val = filter.val
  const col = filter.col as string

  switch (filter.type) {
    case 'eq':
      return record[col] === val
    case 'neq':
      return record[col] !== val
    case 'gte':
      return (record[col] as number) >= (val as number)
    case 'lte':
      return (record[col] as number) <= (val as number)
    case 'ilike': {
      const fieldVal = String(record[col] ?? '')
      const pattern = String(val ?? '')
      if (pattern === '%') return true
      const regexStr = '^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$'
      try {
        return new RegExp(regexStr, 'i').test(fieldVal)
      } catch {
        return fieldVal.toLowerCase().includes(pattern.toLowerCase().replace(/%/g, ''))
      }
    }
    case 'is':
      if (val === null) return record[col] === null || record[col] === undefined
      return record[col] === val
    case 'not': {
      const innerFilter: Filter = { type: filter.op as Filter['type'], col: filter.col, val: filter.val }
      return !matchesFilter(record, innerFilter)
    }
    case 'or':
      if (!filter.filters) return true
      return filter.filters.some(f => matchesFilter(record, f))
    default:
      return true
  }
}

function matchesAllFilters(record: Row, filters: Filter[]): boolean {
  if (filters.length === 0) return true
  for (const filter of filters) {
    if (filter.type === 'or' && filter.filters) {
      if (!filter.filters.some(f => matchesFilter(record, f))) return false
    } else {
      if (!matchesFilter(record, filter)) return false
    }
  }
  return true
}

function parseOrFilterString(str: string): Filter[] {
  const parts = str.split(',')
  return parts.map(p => {
    p = p.trim()
    const eqMatch = p.match(/^(.+?)\.eq\.(.+)$/)
    if (eqMatch) return { type: 'eq', col: eqMatch[1].trim(), val: parseValue(eqMatch[2].trim()) }
    const neqMatch = p.match(/^(.+?)\.neq\.(.+)$/)
    if (neqMatch) return { type: 'neq', col: neqMatch[1].trim(), val: parseValue(neqMatch[2].trim()) }
    const gteMatch = p.match(/^(.+?)\.gte\.(.+)$/)
    if (gteMatch) return { type: 'gte', col: gteMatch[1].trim(), val: parseValue(gteMatch[2].trim()) }
    const lteMatch = p.match(/^(.+?)\.lte\.(.+)$/)
    if (lteMatch) return { type: 'lte', col: lteMatch[1].trim(), val: parseValue(lteMatch[2].trim()) }
    const isMatch = p.match(/^(.+?)\.is\.(.+)$/)
    if (isMatch) return { type: 'is', col: isMatch[1].trim(), val: isMatch[2].trim() === 'null' ? null : parseValue(isMatch[2].trim()) }
    return { type: 'eq', col: p, val: true }
  })
}

function parseValue(v: string): unknown {
  if (v === 'true') return true
  if (v === 'false') return false
  if (v === 'null') return null
  if (!isNaN(Number(v))) return Number(v)
  return v
}

function resolveNestedField(record: Row, fieldPath: string): unknown {
  const parts = fieldPath.split('.')
  let current: unknown = record
  for (const part of parts) {
    if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return current
}

function resolveJoinedRecords(records: Row[], joinTable: string, joinRef: string, fields: string): Row[] {
  if (!joinRef.includes(':')) return records
  const [localKey, foreignKey] = joinRef.split(':')
  const joinData = getTable(joinTable)

  return records.map(record => {
    const fkValue = record[localKey]
    if (!fkValue) return record

    let foreignRecords = joinData.filter(jr => jr[foreignKey || 'id'] === fkValue)
    foreignRecords = filterSelectedFields(foreignRecords, fields)

    const result = { ...record }
    result[joinTable] = foreignRecords.length === 1 ? foreignRecords[0] : foreignRecords
    return result
  })
}

function filterSelectedFields(records: Row[], fields: string): Row[] {
  if (!fields || fields === '*' || fields.trim() === '*') return records
  return records.map(record => {
    const fieldList = fields.split(',').map(f => f.trim()).filter(Boolean)
    const result: Row = {}
    for (const field of fieldList) {
      if (field.includes(':')) {
        const [alias, subFields] = field.split(':')
        const aliases = alias.split(',')
        for (const a of aliases) {
          const trimmed = a.trim()
          if (trimmed in record) {
            result[trimmed] = record[trimmed]
          }
        }
      } else {
        const trimmed = field.trim()
        if (trimmed in record) {
          result[trimmed] = record[trimmed]
        }
      }
    }
    return result
  })
}

function applySequence(records: Row[], seq: { type: string; fn?: (r: Row) => void }[]): Row[] {
  let result = [...records]
  for (const step of seq) {
    if (step.fn) step.fn({} as Row)
  }
  return result
}

class MockQueryBuilder<T = any> {
  private table: string
  private filters: Filter[] = []
  private fields: string = '*'
  private orders: OrderDef[] = []
  private limitCount: number | null = null
  private rangeFrom: number | null = null
  private rangeTo: number | null = null
  private useCount: boolean = false
  private useHead: boolean = false
  private orFilters: Filter[] = []
  private joinRef: string | null = null
  private joinTable: string | null = null
  private notFilters: Filter[] = []
  private pending: { op: 'insert' | 'update' | 'delete'; data?: any } | null = null
  private requireSingle: boolean = false
  private allowNull: boolean = false

  constructor(table: string) {
    this.table = table
  }

  then<R1 = MockResponse<T>, R2 = never>(
    onfulfilled?: ((value: MockResponse<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return Promise.resolve(this.resolve()).then(onfulfilled, onrejected) as Promise<R1 | R2>
  }

  select(fields?: string, opts?: { count?: 'exact'; head?: boolean }): this {
    this.fields = fields || '*'
    if (opts?.count === 'exact') this.useCount = true
    if (opts?.head) this.useHead = true
    return this
  }

  eq(col: string, val: unknown): this {
    this.filters.push({ type: 'eq', col, val })
    return this
  }

  neq(col: string, val: unknown): this {
    this.filters.push({ type: 'neq', col, val })
    return this
  }

  in(col: string, vals: unknown[]): this {
    this.filters.push({ type: 'in', col, val: vals })
    return this
  }

  ilike(col: string, pattern: string): this {
    this.filters.push({ type: 'ilike', col, val: pattern })
    return this
  }

  is(col: string, val: unknown): this {
    this.filters.push({ type: 'is', col, val })
    return this
  }

  not(col: string, op: string, val: unknown): this {
    this.filters.push({ type: 'not', col, val, op })
    return this
  }

  gte(col: string, val: unknown): this {
    this.filters.push({ type: 'gte', col, val })
    return this
  }

  lte(col: string, val: unknown): this {
    this.filters.push({ type: 'lte', col, val })
    return this
  }

  or(filterStr: string): this {
    const parsed = parseOrFilterString(filterStr)
    this.filters.push({ type: 'or', filters: parsed })
    return this
  }

  order(col: string, opts?: { ascending?: boolean; foreignTable?: string }): this {
    this.orders.push({ column: col, ascending: opts?.ascending ?? true, foreignTable: opts?.foreignTable })
    return this
  }

  limit(n: number): this {
    this.limitCount = n
    return this
  }

  range(from: number, to: number): this {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }

  single(): this {
    this.requireSingle = true
    this.allowNull = false
    return this
  }

  maybeSingle(): this {
    this.requireSingle = true
    this.allowNull = true
    return this
  }

  insert(data: any, _opts?: any): this {
    this.pending = { op: 'insert', data }
    return this
  }

  update(data: Partial<T>): this {
    this.pending = { op: 'update', data }
    return this
  }

  delete(): this {
    this.pending = { op: 'delete' }
    return this
  }

  private resolve(): MockResponse<T> {
    if (this.pending) {
      return this.executeMutation()
    }
    return this.executeQuery()
  }

  private executeMutation(): MockResponse<T> {
    const table = getTable(this.table)
    const now = new Date().toISOString()

    if (this.pending!.op === 'insert') {
      const rows = Array.isArray(this.pending!.data) ? this.pending!.data : [this.pending!.data]
      for (const item of rows) {
        if (!item.id) item.id = generateId()
        table.push({ ...item, created_at: item.created_at || now, updated_at: item.updated_at || now })
      }
      setTable(this.table, table)
      return this.finalize(rows as T[], rows.length, true)
    }

    if (this.pending!.op === 'update') {
      const updated: Row[] = []
      for (let i = 0; i < table.length; i++) {
        if (matchesAllFilters(table[i], this.filters)) {
          table[i] = { ...table[i], ...this.pending!.data, updated_at: now }
          updated.push(table[i])
        }
      }
      setTable(this.table, table)
      return this.finalize(updated as T[], updated.length, false)
    }

    const deleted: Row[] = []
    const remaining: Row[] = []
    for (const row of table) {
      if (matchesAllFilters(row, this.filters)) {
        deleted.push(row)
      } else {
        remaining.push(row)
      }
    }
    setTable(this.table, remaining)
    return this.finalize(deleted as T[], deleted.length, false)
  }

  private finalize(data: T | T[], count: number, isArray: boolean): MockResponse<T> {
    if (this.requireSingle) {
      const items = Array.isArray(data) ? data : [data]
      if (items.length === 0) {
        if (this.allowNull) {
          return { data: null, error: null, count: null }
        }
        return {
          data: null,
          error: { message: 'Nenhum registro encontrado', code: 'PGRST116', details: 'The result contains 0 rows' },
          count: null,
        }
      }
      if (items.length > 1) {
        return {
          data: items[0] as T,
          error: { message: 'Múltiplos registros encontrados', code: 'PGRST117', details: `Expected 1, got ${items.length}` },
          count: null,
        }
      }
      return { data: items[0] as T, error: null, count: count != null ? 1 : null }
    }

    if (isArray) {
      return { data: data as T, error: null, count }
    }
    return { data: data as T, error: null, count: null }
  }

  private executeQuery(): MockResponse<T> {
    const table = getTable(this.table)
    let results: Row[] = table.filter(r => matchesAllFilters(r, this.filters))

    for (const order of this.orders) {
      const col = order.column
      results.sort((a, b) => {
        const va = a[col] as any
        const vb = b[col] as any
        if (va == null && vb == null) return 0
        if (va == null) return order.ascending ? -1 : 1
        if (vb == null) return order.ascending ? 1 : -1
        if (typeof va === 'string' && typeof vb === 'string') {
          return order.ascending ? va.localeCompare(vb) : vb.localeCompare(va)
        }
        return order.ascending ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
      })
    }

    const count = this.useCount ? results.length : null

    if (this.rangeFrom != null && this.rangeTo != null) {
      results = results.slice(this.rangeFrom, this.rangeTo + 1)
    } else if (this.limitCount != null) {
      results = results.slice(0, this.limitCount)
    }

    const selected = filterSelectedFields(results, this.fields)

    if (this.requireSingle) {
      if (selected.length === 0) {
        if (this.allowNull) {
          return { data: null, error: null, count: null }
        }
        return {
          data: null,
          error: { message: 'Nenhum registro encontrado', code: 'PGRST116', details: 'The result contains 0 rows' },
          count: null,
        }
      }
      if (selected.length > 1) {
        return {
          data: selected[0] as T,
          error: { message: 'Múltiplos registros encontrados', code: 'PGRST117', details: `Expected 1, got ${selected.length}` },
          count: null,
        }
      }
      return { data: selected[0] as T, error: null, count: count != null ? 1 : null }
    }

    return { data: selected as T, error: null, count }
  }

}

class MockAuthAdmin {
  async createUser(attrs: { email: string; email_confirm?: boolean; user_metadata?: Record<string, unknown> }): Promise<{ data: { user: { id: string; email: string } } | null; error: any }> {
    const db = loadDb()
    if (!db['auth_users']) db['auth_users'] = []
    const existing = db['auth_users'].find(u => u.email === attrs.email)
    if (existing) {
      return { data: { user: existing as any }, error: null }
    }
    const newUser = {
      id: generateId(),
      email: attrs.email,
      user_metadata: attrs.user_metadata || {},
    }
    db['auth_users'].push(newUser)
    cachedDb = db
    saveDb()
    return { data: { user: newUser as any }, error: null }
  }

  async listUsers(): Promise<{ data: { users: any[] }; error: any }> {
    const db = loadDb()
    return { data: { users: db['auth_users'] || [] }, error: null }
  }
}

class MockAuth {
  admin = new MockAuthAdmin()

  async getUser(): Promise<{ data: { user: any } | null; error: any }> {
    const db = loadDb()
    const users = db['auth_users'] || []
    if (users.length === 0) return { data: null, error: null }
    return { data: { user: users[0] }, error: null }
  }
}

class MockSupabaseClient {
  auth = new MockAuth()

  from(table: string): MockQueryBuilder {
    return new MockQueryBuilder(table)
  }
}

let mockInstance: MockSupabaseClient | null = null

export function getMockClient(): MockSupabaseClient {
  if (!mockInstance) mockInstance = new MockSupabaseClient()
  return mockInstance
}

export function isDevMode(): boolean {
  return process.env.DEV_MODE === 'true' || process.env.NODE_ENV !== 'production'
}
