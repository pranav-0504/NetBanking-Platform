import Account from "../models/account.model.js";
import Beneficiary from "../models/beneficiary.model.js";
import FraudAlert from "../models/fraudAlert.model.js";
import Transaction from "../models/transaction.model.js";
import User from "../models/user.model.js";

export const getAdminOverview = async (_req, res) => {
  try {
    const [
      totalUsers,
      activeAccounts,
      beneficiaryCount,
      totalBalance,
      transactionCount,
      transactionVolume,
      pendingTransactions,
      pendingAlerts,
      recentTransactions,
      recentUsers,
      fraudAlerts,
    ] = await Promise.all([
      User.countDocuments(),
      Account.countDocuments({ isActive: true }),
      Beneficiary.countDocuments(),
      Account.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]),
      Transaction.countDocuments(),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.countDocuments({ status: "pending" }),
      FraudAlert.countDocuments({ status: "pending" }),
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .select(
          "txnId amount transferMode status isFlagged fraudScore createdAt fromUserId toUserId",
        )
        .populate("fromUserId", "firstName lastName email")
        .populate("toUserId", "firstName lastName email"),
      User.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select(
          "firstName lastName email mobile role isEmailVerified createdAt",
        ),
      FraudAlert.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("userId", "firstName lastName email")
        .populate("transactionId", "txnId amount")
        .select(
          "reason ruleTriggered fraudScore status createdAt userId transactionId",
        ),
    ]);
    return res
      .status(200)
      .json({
        success: true,
        data: {
          metrics: {
            totalUsers,
            activeAccounts,
            beneficiaryCount,
            transactionCount,
            pendingTransactions,
            pendingAlerts,
            totalBalance: totalBalance[0]?.total || 0,
            transactionVolume: transactionVolume[0]?.total || 0,
          },
          recentTransactions,
          recentUsers,
          fraudAlerts,
        },
      });
  } catch {
    return res
      .status(500)
      .json({
        success: false,
        message: "Unable to load administrator dashboard data.",
      });
  }
};
