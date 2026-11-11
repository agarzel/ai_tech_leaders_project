export type PageQuery = { page: number; pageSize: number };

export type Page<T> = PageQuery & { items: T[]; total: number };

/** Who performs a write through makeCrudRoute – the session the access guard accepted (audit log, #119). */
export type CrudContext = { actorUserId: string };

/** Contract a service implements to be exposed through makeCrudRoute. `context` is always passed by makeCrudRoute. */
export interface CrudService<TDto, TCreate, TUpdate> {
  list(query: PageQuery): Promise<Page<TDto>>;
  get(id: string): Promise<TDto>;
  create(input: TCreate, context?: CrudContext): Promise<TDto>;
  update(id: string, input: TUpdate, context?: CrudContext): Promise<TDto>;
  delete(id: string, context?: CrudContext): Promise<void>;
}
