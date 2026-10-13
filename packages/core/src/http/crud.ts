export type PageQuery = { page: number; pageSize: number };

export type Page<T> = PageQuery & { items: T[]; total: number };

/** Contract a service implements to be exposed through makeCrudRoute. */
export interface CrudService<TDto, TCreate, TUpdate> {
  list(query: PageQuery): Promise<Page<TDto>>;
  get(id: string): Promise<TDto>;
  create(input: TCreate): Promise<TDto>;
  update(id: string, input: TUpdate): Promise<TDto>;
  delete(id: string): Promise<void>;
}
