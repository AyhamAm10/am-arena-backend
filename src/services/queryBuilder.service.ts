import { SelectQueryBuilder } from "typeorm";

type FilterType = "like" | "equal" | "range";

export interface FilterDefinition<T> {
  field: keyof T | string;
  type: FilterType;
  paramName?: string;
  alias?: string;
}

export class GenericFilterBuilder<T> {
  private qb: SelectQueryBuilder<T>;
  private alias: string;

  constructor(qb: SelectQueryBuilder<T>, alias: string) {
    this.qb = qb;
    this.alias = alias;
  }

  applyFilters(
    dto: Partial<Record<string, any>>,
    filters: FilterDefinition<T>[]
  ) {
    filters.forEach(({ field, type, paramName, alias }) => {
      const key = paramName ?? String(field);
      const value = dto[key];
      if (value === undefined || value === null) return;

      const dbField = alias
        ? `${alias}.${String(field)}`
        : `${this.alias}.${String(field)}`;

      switch (type) {
        case "like":
          this.qb.andWhere(`${dbField} ILIKE :${key}`, { [key]: `%${value}%` });
          break;

        case "equal":
          this.qb.andWhere(`${dbField} = :${key}`, { [key]: value });
          break;

        case "range":
          if (value.from !== undefined) {
            this.qb.andWhere(`${dbField} >= :${key}From`, {
              [`${key}From`]: value.from,
            });
          }
          if (value.to !== undefined) {
            this.qb.andWhere(`${dbField} <= :${key}To`, {
              [`${key}To`]: value.to,
            });
          }
          break;
      }
    });

    return this.qb;
  }
}
