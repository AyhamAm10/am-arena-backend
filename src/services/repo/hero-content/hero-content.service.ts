import { Ensure } from "../../../common/errors/Ensure.handler";
import { HeroContent } from "../../../entities/HeroContent";
import { RepoService } from "../../repo.service";
import { CreateHeroContentDto } from "../../../dto/hero-content/create-hero-content.dto";
import { UpdateHeroContentDto } from "../../../dto/hero-content/update-hero-content.dto";
import { GetHeroContentQueryDto } from "../../../dto/hero-content/get-hero-content-query.dto";
import { mediaResponseUrl } from "../../../utils/media-url";

function mapHeroContentRow(row: HeroContent) {
  return {
    ...row,
    image: mediaResponseUrl(row.image),
  };
}

export class HeroContentService extends RepoService<HeroContent> {
  constructor() {
    super(HeroContent);
    this.createHeroContent = this.createHeroContent.bind(this);
    this.updateHeroContent = this.updateHeroContent.bind(this);
    this.deleteHeroContent = this.deleteHeroContent.bind(this);
    this.getHeroContent = this.getHeroContent.bind(this);
    this.getHeroContents = this.getHeroContents.bind(this);
  }

  async createHeroContent(
    params: CreateHeroContentDto & { image_url: string; image_public_id?: string | null }
  ) {
    Ensure.required(params.image_url, "image_url");
    Ensure.required(params.title, "title");
    Ensure.required(params.description, "description");
    const row = await this.create({
      image: params.image_url,
      image_public_id: params.image_public_id ?? null,
      title: params.title,
      description: params.description,
    });
    return mapHeroContentRow(row as HeroContent);
  }

  async updateHeroContent(
    id: string | number,
    params: UpdateHeroContentDto & { image_public_id?: string | null }
  ) {
    await this.getById(id);
    const data: Record<string, unknown> = {};
    if (params.image !== undefined) data.image = params.image;
    if (params.image_public_id !== undefined) data.image_public_id = params.image_public_id;
    if (params.title !== undefined) data.title = params.title;
    if (params.description !== undefined) data.description = params.description;
    if (Object.keys(data).length === 0) {
      const row = (await this.getById(id)) as HeroContent;
      return mapHeroContentRow(row);
    }
    const updated = await this.update(id, data as any);
    return mapHeroContentRow(updated as HeroContent);
  }

  async deleteHeroContent(id: string | number) {
    await this.delete(id);
  }

  async getHeroContent(id: string | number) {
    const row = (await this.getById(id)) as HeroContent;
    return mapHeroContentRow(row);
  }

  async getHeroContents(query: GetHeroContentQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const result = await this.getAllWithPagination({
      page,
      limit,
      order: { created_at: "DESC" },
    });
    return {
      ...result,
      data: (result.data as HeroContent[]).map(mapHeroContentRow),
    };
  }
}
