import Account from "../models/account.model.js";
import Beneficiary from "../models/beneficiary.model.js";
import User from "../models/user.model.js";

const DEMO_BENEFICIARY = {
  accountNumber: "45576068",
  ifscCode: "NEX002232",
  accountHolderName: "Sujal Singla",
  nickName: "Sujal Singla",
};

const getDemoAccount = async () => {
  let account = await Account.findOne({
    accountNumber: DEMO_BENEFICIARY.accountNumber,
    ifscCode: DEMO_BENEFICIARY.ifscCode,
  });
  if (account) return account;

  const sujal = await User.findOne({
    firstName: /^Sujal$/i,
    lastName: /^Singla$/i,
  });
  if (!sujal) return null;

  account = await Account.create({
    userId: sujal._id,
    accountNumber: DEMO_BENEFICIARY.accountNumber,
    ifscCode: DEMO_BENEFICIARY.ifscCode,
    type: "savings",
    balance: 500000,
    isActive: true,
  });
  return account;
};

export const addDefaultBeneficiaryForUser = async (userId) => {
  const demoAccount = await getDemoAccount();
  if (!demoAccount || String(demoAccount.userId) === String(userId))
    return false;

  await Beneficiary.updateOne(
    {
      userId,
      accountNumber: DEMO_BENEFICIARY.accountNumber,
      ifscCode: DEMO_BENEFICIARY.ifscCode,
    },
    {
      $setOnInsert: {
        userId,
        ...DEMO_BENEFICIARY,
        bankName: "NexBank",
        isVerified: true,
        addedAt: new Date(),
      },
    },
    { upsert: true },
  );
  return true;
};

export const backfillDefaultBeneficiary = async () => {
  const demoAccount = await getDemoAccount();
  if (!demoAccount) return { added: 0, reason: "Sujal Singla user not found" };

  const accounts = await Account.find({
    isActive: true,
    userId: { $ne: demoAccount.userId },
  }).select("userId");
  if (!accounts.length) return { added: 0 };
  const result = await Beneficiary.bulkWrite(
    accounts.map((account) => ({
      updateOne: {
        filter: {
          userId: account.userId,
          accountNumber: DEMO_BENEFICIARY.accountNumber,
          ifscCode: DEMO_BENEFICIARY.ifscCode,
        },
        update: {
          $setOnInsert: {
            userId: account.userId,
            ...DEMO_BENEFICIARY,
            bankName: "NexBank",
            isVerified: true,
            addedAt: new Date(),
          },
        },
        upsert: true,
      },
    })),
  );
  return { added: result.upsertedCount || 0 };
};
