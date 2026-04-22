import { AppDataSource } from "../../../config/data_source";
import { CreatePackageDto } from "../../../dto/package/create-package.dto";
import { Package } from "../../../entities/package";
import { RepoService } from "../../repo.service";

export class PackageService extends RepoService<Package> {
  constructor() {
    super(Package);
    this.listActivePackages = this.listActivePackages.bind(this);
    this.createPackage = this.createPackage.bind(this);
  }

  async listActivePackages() {
    const repo = AppDataSource.getRepository(Package);
    const rows = await repo.find({
      where: { is_active: true },
      order: { coins: "ASC" },
    });
    return rows.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      coins: pkg.coins,
      price: Number(pkg.price || 0),
      is_active: pkg.is_active,
      created_at:
        pkg.created_at instanceof Date
          ? pkg.created_at.toISOString()
          : String(pkg.created_at),
    }));
  }

  async createPackage(dto: CreatePackageDto) {
    const repo = AppDataSource.getRepository(Package);
    const pkg = await repo.save(
      repo.create({
        name: dto.name.trim(),
        price: Number(dto.price || 0),
        coins: Number(dto.coins || 0),
        is_active: dto.is_active ?? true,
      }),
    );
    return {
      id: pkg.id,
      name: pkg.name,
      coins: pkg.coins,
      price: Number(pkg.price || 0),
      is_active: pkg.is_active,
      created_at:
        pkg.created_at instanceof Date
          ? pkg.created_at.toISOString()
          : String(pkg.created_at),
    };
  }
}
