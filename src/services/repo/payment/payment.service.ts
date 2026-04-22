import { Ensure } from "../../../common/errors/Ensure.handler";
import { AppDataSource } from "../../../config/data_source";
import { Payment } from "../../../entities/payment";
import { Package } from "../../../entities/package";
import { User } from "../../../entities/User";
import { Wallet } from "../../../entities/wallet";
import { WalletTransaction } from "../../../entities/wallet_transaction";
import { CreatePaymentRequestDto } from "../../../dto/payment/create-payment-request.dto";
import {
  GetAdminPackageRequestsQueryDto,
} from "../../../dto/admin/admin-package-requests.dto";
import { CreateManualCoinsDto } from "../../../dto/admin/admin-manual-coins.dto";
import { RepoService } from "../../repo.service";
import { NotificationService } from "../notification/notification.service";

export class PaymentService extends RepoService<Payment> {
  constructor() {
    super(Payment);
    this.createPaymentRequest = this.createPaymentRequest.bind(this);
    this.listPackageRequests = this.listPackageRequests.bind(this);
    this.approveRequest = this.approveRequest.bind(this);
    this.rejectRequest = this.rejectRequest.bind(this);
    this.addManualCoins = this.addManualCoins.bind(this);
  }

  async createPaymentRequest(userId: number, dto: CreatePaymentRequestDto) {
    const packageRepo = AppDataSource.getRepository(Package);
    const paymentRepo = AppDataSource.getRepository(Payment);

    const pkg = await packageRepo.findOneBy({ id: Number(dto.package_id), is_active: true });
    Ensure.exists(pkg, "package");

    const payment = await paymentRepo.save(
      paymentRepo.create({
        user: { id: userId } as User,
        package: { id: pkg!.id } as Package,
        price: Number(pkg!.price || 0),
        coins: Number(pkg!.coins || 0),
        method: dto.method ?? "manual",
        reference: dto.reference ?? null,
        status: "pending",
      }),
    );

    const notificationService = new NotificationService();
    await notificationService.notifySystemUsers(
      [userId],
      "تم استلام طلبك وهو قيد المراجعة",
      "تم استلام طلبك وهو قيد المراجعة",
      {
        type: "SYSTEM_MESSAGE",
      },
    );

    return {
      id: payment.id,
      status: payment.status,
      coins: payment.coins,
      price: Number(payment.price || 0),
      package_name: pkg!.name,
      created_at:
        payment.created_at instanceof Date
          ? payment.created_at.toISOString()
          : String(payment.created_at),
    };
  }

  async listPackageRequests(query: GetAdminPackageRequestsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const skip = (page - 1) * limit;
    const paymentRepo = AppDataSource.getRepository(Payment);
    const qb = paymentRepo
      .createQueryBuilder("payment")
      .leftJoinAndSelect("payment.user", "user")
      .leftJoinAndSelect("payment.package", "package")
      .leftJoinAndSelect("payment.approved_by", "approved_by")
      .orderBy("payment.created_at", "DESC")
      .skip(skip)
      .take(limit);

    if (query.status) {
      qb.andWhere("payment.status = :status", { status: query.status });
    }
    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        "(user.full_name ILIKE :search OR user.gamer_name ILIKE :search OR package.name ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    const [rows, total] = await qb.getManyAndCount();
    return {
      data: rows.map((row) => ({
        id: row.id,
        status: row.status,
        price: Number(row.price || 0),
        coins: Number(row.coins || 0),
        method: row.method ?? null,
        reference: row.reference ?? null,
        created_at:
          row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at),
        approved_at: row.approved_at ? new Date(row.approved_at).toISOString() : null,
        user: {
          id: row.user?.id,
          full_name: row.user?.full_name,
          gamer_name: row.user?.gamer_name,
        },
        package: row.package
          ? {
              id: row.package.id,
              name: row.package.name,
            }
          : null,
      })),
      total,
      page,
      limit,
    };
  }

  async approveRequest(paymentId: number, adminUserId: number) {
    return AppDataSource.manager.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const userRepo = manager.getRepository(User);
      const walletRepo = manager.getRepository(Wallet);
      const txRepo = manager.getRepository(WalletTransaction);

      const payment = await paymentRepo
        .createQueryBuilder("payment")
        .setLock("pessimistic_write")
        .innerJoinAndSelect("payment.user", "user")
        .innerJoinAndSelect("payment.package", "package")
        .where("payment.id = :id", { id: paymentId })
        .getOne();
      Ensure.exists(payment, "payment");
      Ensure.custom(payment!.status === "pending", "Payment is not pending");

      const user = await userRepo
        .createQueryBuilder("user")
        .setLock("pessimistic_write")
        .where("user.id = :id", { id: payment!.user.id })
        .getOne();
      Ensure.exists(user, "user");

      user!.coins = Number(user!.coins || 0) + Number(payment!.coins || 0);
      await userRepo.save(user!);

      let wallet = await walletRepo.findOne({
        where: { user: { id: user!.id } } as any,
        relations: ["user"],
      });
      if (!wallet) {
        wallet = walletRepo.create({
          user: { id: user!.id } as User,
          balance: Number(user!.coins || 0),
        });
      } else {
        wallet.balance = Number(user!.coins || 0);
      }
      await walletRepo.save(wallet);

      await txRepo.save(
        txRepo.create({
          user: { id: user!.id } as User,
          amount: Number(payment!.coins || 0),
          type: "deposit",
          status: "approved",
          payment: { id: payment!.id } as Payment,
        }),
      );

      payment!.status = "approved";
      payment!.approved_at = new Date();
      payment!.approved_by = { id: adminUserId } as User;
      await paymentRepo.save(payment!);

      const notificationService = new NotificationService();
      await notificationService.notifySystemUsers(
        [user!.id],
        "تمت الموافقة على طلبك وتم إضافة العملات إلى محفظتك",
        "تمت الموافقة على طلبك وتم إضافة العملات إلى محفظتك",
        {
          type: "SYSTEM_MESSAGE",
          route: "/(tabs)/wallet",
          actionLabel: "فتح المحفظة",
        },
      );

      return {
        id: payment!.id,
        status: payment!.status,
        user_id: user!.id,
        balance: Number(user!.coins || 0),
      };
    });
  }

  async rejectRequest(paymentId: number) {
    return AppDataSource.manager.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);
      const payment = await paymentRepo
        .createQueryBuilder("payment")
        .setLock("pessimistic_write")
        .where("payment.id = :id", { id: paymentId })
        .getOne();
      Ensure.exists(payment, "payment");
      Ensure.custom(payment!.status === "pending", "Payment is not pending");
      payment!.status = "rejected";
      await paymentRepo.save(payment!);
      return {
        id: payment!.id,
        status: payment!.status,
      };
    });
  }

  async addManualCoins(dto: CreateManualCoinsDto, adminUserId: number) {
    return AppDataSource.manager.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const walletRepo = manager.getRepository(Wallet);
      const txRepo = manager.getRepository(WalletTransaction);

      const user = await userRepo
        .createQueryBuilder("user")
        .setLock("pessimistic_write")
        .where("user.id = :id", { id: Number(dto.user_id) })
        .getOne();
      Ensure.exists(user, "user");
      user!.coins = Number(user!.coins || 0) + Number(dto.amount || 0);
      await userRepo.save(user!);

      let wallet = await walletRepo.findOne({
        where: { user: { id: user!.id } } as any,
        relations: ["user"],
      });
      if (!wallet) {
        wallet = walletRepo.create({
          user: { id: user!.id } as User,
          balance: Number(user!.coins || 0),
        });
      } else {
        wallet.balance = Number(user!.coins || 0);
      }
      await walletRepo.save(wallet);

      await txRepo.save(
        txRepo.create({
          user: { id: user!.id } as User,
          amount: Number(dto.amount || 0),
          type: "deposit",
          status: "approved",
        }),
      );

      const notificationService = new NotificationService();
      await notificationService.notifySystemUsers(
        [user!.id],
        "تمت إضافة رصيد إلى محفظتك",
        "تمت إضافة رصيد إلى محفظتك",
        {
          type: "SYSTEM_MESSAGE",
          route: "/(tabs)/wallet",
          actionLabel: "فتح المحفظة",
          byAdminId: adminUserId,
        },
      );

      return {
        user_id: user!.id,
        balance: Number(user!.coins || 0),
      };
    });
  }
}
