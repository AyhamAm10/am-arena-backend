import { Ensure } from "../../../common/errors/Ensure.handler";
import { HeroContent } from "../../../entities/HeroContent";
import { RepoService } from "../../repo.service";
import { CreateHeroContentDto } from "../../../dto/hero-content/create-hero-content.dto";
import { UpdateHeroContentDto } from "../../../dto/hero-content/update-hero-content.dto";
import { GetHeroContentQueryDto } from "../../../dto/hero-content/get-hero-content-query.dto";

export class HeroContentService extends RepoService<HeroContent> {
  constructor() {
    super(HeroContent);
    this.createHeroContent = this.createHeroContent.bind(this);
    this.updateHeroContent = this.updateHeroContent.bind(this);
    this.deleteHeroContent = this.deleteHeroContent.bind(this);
    this.getHeroContent = this.getHeroContent.bind(this);
    this.getHeroContents = this.getHeroContents.bind(this);
  }

  async createHeroContent(params: CreateHeroContentDto) {
    Ensure.required(params.image, "image");
    Ensure.required(params.title, "title");
    Ensure.required(params.description, "description");
    return await this.create({
      image: params.image,
      title: params.title,
      description: params.description,
    });
  }

  async updateHeroContent(id: string | number, params: UpdateHeroContentDto) {
    await this.getById(id);
    const data: Record<string, unknown> = {};
    if (params.image !== undefined) data.image = params.image;
    if (params.title !== undefined) data.title = params.title;
    if (params.description !== undefined) data.description = params.description;
    if (Object.keys(data).length === 0) return await this.getById(id);
    return await this.update(id, data as any);
  }

  async deleteHeroContent(id: string | number) {
    await this.delete(id);
  }

  async getHeroContent(id: string | number) {
    return await this.getById(id);
  }

  async getHeroContents(query: GetHeroContentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    return await this.getAllWithPagination({
      page,
      limit,
      order: { created_at: "DESC" },
    });
  }
}
