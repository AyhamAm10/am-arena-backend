import { Ensure } from "../common/errors/Ensure.handler";
import { AppDataSource } from "../config/data_source";
import {
  DeepPartial,
  EntityTarget,
  EntityManager,
  FindOptionsWhere,
  FindOptionsOrder,
  ObjectLiteral,
  Repository,
} from "typeorm";

type RelationPaths<T> =
  | Extract<keyof T, string>
  | `${Extract<keyof T, string>}.${string}`;

// E extends Record<any, any> ,
// R extends Array<any> = Array<keyof E>,
// T extends ObjectLiteral = E
export class RepoService<
  E extends Record<any, any>,
  R extends RelationPaths<E>[] = RelationPaths<E>[],
  T extends ObjectLiteral = E
> {
  protected repo: Repository<T>;

  constructor(entity: EntityTarget<T>) {
    this.repo = AppDataSource.getRepository(entity);
  }

  private normalizeId(id: number | string): number {
    const parsedId = typeof id === "string" ? parseInt(id, 10) : id;
    Ensure.isNumber(parsedId, "id");
    return parsedId;
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repo.create(data);
    return await this.repo.save(entity);
  }

  async update(id: string | number, data: DeepPartial<T>): Promise<T> {
    const normalizedId = this.normalizeId(id);
    const entity = await this.repo.findOneBy({ id: normalizedId } as any);
    Ensure.exists(entity, "item");
    const updatedEntity = this.repo.merge(entity, data);
    return await this.repo.save(updatedEntity);
  }

  async delete(id: string | number): Promise<void> {
    const normalizedId = this.normalizeId(id);
    const existing = await this.repo.findOneBy({ id: normalizedId } as any);
    Ensure.exists(existing, "item");
    await this.repo.delete(normalizedId);
  }

  async remove(data: T[]) {
    return await this.repo.remove(data);
  }

  async getById(id: number | string, relations?: R): Promise<T | null> {
    const normalizedId = this.normalizeId(id);
    const existing = await this.repo.findOne({
      where: { id: normalizedId } as unknown as FindOptionsWhere<T>,
      relations: relations as string[],
    });
    Ensure.exists(existing, "item");
    return existing;
  }

  async getAll(options?: {
    relations?: R;
    where?: FindOptionsWhere<T>;
  }): Promise<T[]> {
    return this.repo.find({
      relations: options?.relations as string[],
      where: options?.where,
    });
  }

  async getAllWithPagination(options?: {
    relations?: R;
    where?: FindOptionsWhere<T>;
    page?: number;
    limit?: number;
    order?: FindOptionsOrder<T>;
  }): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.repo.findAndCount({
      where: options?.where,
      relations: options?.relations as string[],
      order: options?.order,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOneByCondition(
    where: FindOptionsWhere<T>,
    relations?: R
  ): Promise<T | null> {
    return this.repo.findOne({ where, relations: relations as string[] });
  }

  async findManyByCondition(
    where: FindOptionsWhere<T>,
    relations?: R
  ): Promise<T[]> {
    return this.repo.find({ where, relations: relations as string[] });
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repo.count({ where });
    return count > 0;
  }

  async count(where?: FindOptionsWhere<T>): Promise<number> {
    return this.repo.count({ where });
  }

  async createOrUpdate(
    condition: FindOptionsWhere<T>,
    data: DeepPartial<T>
  ): Promise<T> {
    const existing = await this.repo.findOne({ where: condition });

    if (existing) {
      const updatedEntity = this.repo.merge(existing, data);
      return await this.repo.save(updatedEntity);
    }

    return this.create(data);
  }

  async createWithTransaction(
    actions: (manager: EntityManager) => Promise<any>
  ): Promise<any> {
    return AppDataSource.manager.transaction(
      async (transactionalEntityManager) => {
        return actions(transactionalEntityManager);
      }
    );
  }

  async createManyRaw<D = any>(
    rawItems: D[],
    transform: (item: D) => DeepPartial<T>,
    entity: string
  ): Promise<T[]> {
    Ensure.isArray(rawItems, entity);

    const entities = rawItems
      .map(transform)
      .map((data) => this.repo.create(data));
    return await this.repo.save(entities);
  }
}
