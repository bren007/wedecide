import type { NextApiRequest, NextApiResponse } from 'next';
import { initializeAdmin } from '@/lib/firebase/server-admin';
import type { UserRole } from '@/lib/types';

type Data = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { auth } = initializeAdmin();
    const { uid, role, tenantId } = req.body;

    if (!uid || !role || !tenantId) {
        return res.status(400).json({ message: 'Missing uid, role, or tenantId' });
    }

    // You should add validation here to ensure the calling user is an admin
    // For this prototype, we are skipping that step.

    await auth.setCustomUserClaims(uid, { role, tenantId });

    res.status(200).json({ message: `Role '${role}' assigned to user ${uid} for tenant ${tenantId}.` });
  } catch (error: any) {
    console.error('Error setting custom claim:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
