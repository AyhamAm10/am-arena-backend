import { Ensure } from "../../../common/errors/Ensure.handler";
import { Wallet } from "../../../entities/wallet";
import { WalletTransaction } from "../../../entities/wallet_transaction";
import { User } from "../../../entities/User";
import { GetWalletTransactionsQueryDto } from "../../../dto/wallet/get-wallet-transactions-query.dto";
import { RepoService } from "../../repo.service";
import { AppDataSource } from "../../../config/data_source";

export class WalletService extends RepoService<Wallet> {
  constructor() {
    super(Wallet);
    this.getMyWallet = this.getMyWallet.bind(this);
    this.getMyTransactions = this.getMyTransactions.bind(this);
    this.ensureWalletForUser = this.ensureWalletForUser.bind(this);
  }

  async ensureWalletForUser(userId: number) {
    const userRepo = AppDataSource.getRepository(User);
    const walletRepo = AppDataSource.getRepository(Wallet);
    const user = await userRepo.findOne({ where: { id: userId }, select: ["id", "coins"] });
    Ensure.exists(user, "user");

    let wallet = await walletRepo.findOne({
      where: { user: { id: userId } } as any,
      relations: ["user"],
    });
    if (!wallet) {
      wallet = await walletRepo.save(
        walletRepo.create({
          user: { id: userId } as User,
          balance: Number(user!.coins || 0),
        }),
      );
    }
    return wallet;
  }

  async getMyWallet(userId: number) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: userId },
      select: ["id", "coins", "full_name", "gamer_name"],
    });
    Ensure.exists(user, "user");
    const wallet = await this.ensureWalletForUser(userId);

    if (Number(wallet.balance || 0) !== Number(user!.coins || 0)) {
      wallet.balance = Number(user!.coins || 0);
      await AppDataSource.getRepository(Wallet).save(wallet);
    }

    return {
      user_id: user!.id,
      full_name: user!.full_name,
      gamer_name: user!.gamer_name,
      balance: Number(user!.coins || 0),
    };
  }

  async getMyTransactions(userId: number, query: GetWalletTransactionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 15;
    const skip = (page - 1) * limit;
    const txRepo = AppDataSource.getRepository(WalletTransaction);

    const [rows, total] = await txRepo.findAndCount({
      where: { user: { id: userId } } as any,
      relations: ["payment", "payment.package"],
      order: { created_at: "DESC" },
      skip,
      take: limit,
    });

    return {
      data: rows.map((row) => ({
        id: row.id,
        type: row.type,
        status: row.status,
        amount: Number(row.amount || 0),
        created_at:
          row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at),
        payment_id: row.payment?.id ?? null,
        package_name: row.payment?.package?.name ?? null,
      })),
      total,
      page,
      limit,
    };
  }
}
