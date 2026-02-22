import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaguePrize } from '../database/entities/league-prize.entity';
import { LeagueBanner } from '../database/entities/league-banner.entity';
import { League } from '../database/entities/league.entity';

@Injectable()
export class LeagueExtraService {
  constructor(
    @InjectRepository(LeaguePrize)
    private prizeRepository: Repository<LeaguePrize>,
    @InjectRepository(LeagueBanner)
    private bannerRepository: Repository<LeagueBanner>,
    @InjectRepository(League)
    private leagueRepository: Repository<League>,
  ) {}

  // --- PRIZES CRM ---

  async getPrizes(leagueId: string) {
    return this.prizeRepository.find({
      where: { leagueId },
      order: { order: 'ASC' },
    });
  }

  async createPrize(leagueId: string, data: any) {
    const prize = this.prizeRepository.create({
      ...data,
      leagueId,
    });
    return this.prizeRepository.save(prize);
  }

  async updatePrize(prizeId: string, data: any) {
    const prize = await this.prizeRepository.findOne({ where: { id: prizeId } });
    if (!prize) throw new NotFoundException('Prize not found');
    Object.assign(prize, data);
    return this.prizeRepository.save(prize);
  }

  async deletePrize(prizeId: string) {
    return this.prizeRepository.delete(prizeId);
  }

  async reorderPrizes(leagueId: string, prizeIds: string[]) {
    await Promise.all(
      prizeIds.map((id, index) =>
        this.prizeRepository.update(id, { order: index }),
      ),
    );
    return this.getPrizes(leagueId);
  }

  // --- BANNERS CRM ---

  async getBanners(leagueId: string) {
    return this.bannerRepository.find({
      where: { leagueId },
      order: { order: 'ASC' },
    });
  }

  async createBanner(leagueId: string, data: any) {
    // Max 5 banners check
    const count = await this.bannerRepository.count({ where: { leagueId } });
    if (count >= 5) throw new ForbiddenException('Maximum 5 banners allowed per league');

    const banner = this.bannerRepository.create({
      ...data,
      leagueId,
    });
    return this.bannerRepository.save(banner);
  }

  async updateBanner(bannerId: string, data: any) {
    const banner = await this.bannerRepository.findOne({ where: { id: bannerId } });
    if (!banner) throw new NotFoundException('Banner not found');
    Object.assign(banner, data);
    return this.bannerRepository.save(banner);
  }

  async deleteBanner(bannerId: string) {
    return this.bannerRepository.delete(bannerId);
  }

  async reorderBanners(leagueId: string, bannerIds: string[]) {
    await Promise.all(
      bannerIds.map((id, index) =>
        this.bannerRepository.update(id, { order: index }),
      ),
    );
    return this.getBanners(leagueId);
  }
}
