import test from 'node:test';
import assert from 'node:assert/strict';
import { api } from '../src/services/api';

// In-memory mock for localStorage in Node test runner
const memoryStorage: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => memoryStorage[key] || null,
    setItem: (key: string, val: string) => {
      memoryStorage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
    clear: () => {
      Object.keys(memoryStorage).forEach((k) => delete memoryStorage[k]);
    },
  };
}

test('OMIZON Returns & Refunds — Frontend Service & Integration Unit Tests', async (t) => {
  // Store original fetch
  const originalFetch = globalThis.fetch;

  await t.test('1. api.returns.getEligibility fetches and returns structured eligibility data', async () => {
    globalThis.fetch = async (url: any, opts: any) => {
      assert.match(String(url), /\/returns\/eligibility\/ord_1001/);
      assert.equal(opts.method, 'GET');
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          orderId: 'ord_1001',
          deliveryStatus: 'delivered',
          paymentMethod: 'UPI',
          totalAmount: 4999,
          eligibility: {
            isEligible: true,
            reason: 'Eligible for return',
            deliveryDate: '2026-11-20T10:00:00.000Z',
            returnDeadline: '2026-12-05T10:00:00.000Z',
            windowDays: 15,
            items: [
              {
                product: 'prod_001',
                name: 'Studio Wireless Headphones',
                variant: 'Midnight Violet',
                price: 4999,
                purchasedQuantity: 1,
                alreadyReturnedQuantity: 0,
                eligibleQuantity: 1,
                isEligible: true
              }
            ]
          }
        })
      } as any;
    };

    const res = await api.returns.getEligibility('ord_1001');
    assert.equal(res.isEligible ?? res.eligibility?.isEligible, true);
    assert.equal(res.eligibility.items[0].eligibleQuantity, 1);
  });

  await t.test('2. api.returns.create submits structured return payload and returns RMA shipments', async () => {
    let capturedBody: any = null;
    globalThis.fetch = async (url: any, opts: any) => {
      assert.match(String(url), /\/returns$/);
      assert.equal(opts.method, 'POST');
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        status: 201,
        headers: { get: () => 'application/json' },
        json: async () => ({
          message: 'Return request created successfully',
          returns: [
            {
              _id: 'ret_001',
              rmaNumber: 'RMA-20261123-A1B2C3',
              totalRefundAmount: 4999,
              status: 'requested'
            }
          ]
        })
      } as any;
    };

    const payload = {
      orderId: 'ord_1001',
      items: [
        {
          product: 'prod_001',
          variant: 'Midnight Violet',
          quantity: 1,
          reason: 'Defective, damaged, or broken item',
          customerNotes: 'Left ear cup has no sound',
          evidenceImages: ['https://storage.omizon.in/proof1.jpg']
        }
      ],
      refundMethod: 'ORIGINAL_GATEWAY'
    };

    const res = await api.returns.create(payload);
    assert.equal(capturedBody.orderId, 'ord_1001');
    assert.equal(capturedBody.items[0].quantity, 1);
    assert.equal(res.returns[0].rmaNumber, 'RMA-20261123-A1B2C3');
  });

  await t.test('3. api.returns.seller.review submits approval or rejection with mandatory reason', async () => {
    let capturedBody: any = null;
    globalThis.fetch = async (url: any, opts: any) => {
      assert.match(String(url), /\/returns\/seller\/ret_001\/review$/);
      assert.equal(opts.method, 'POST');
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          message: 'Return request rejected successfully',
          returnRequest: {
            _id: 'ret_001',
            status: 'rejected',
            rejectionReason: capturedBody.rejectionReason
          }
        })
      } as any;
    };

    const res = await api.returns.seller.review('ret_001', {
      action: 'reject',
      rejectionReason: 'policy_violation',
      note: 'Item reported unsealed past return policy limit'
    });

    assert.equal(capturedBody.action, 'reject');
    assert.equal(capturedBody.rejectionReason, 'policy_violation');
    assert.equal(res.returnRequest.status, 'rejected');
  });

  await t.test('4. api.returns.seller.inspect submits diagnostic checklist and disposition', async () => {
    let capturedBody: any = null;
    globalThis.fetch = async (url: any, opts: any) => {
      assert.match(String(url), /\/returns\/seller\/ret_001\/inspect$/);
      assert.equal(opts.method, 'POST');
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          message: 'Quality inspection and inventory disposition completed successfully',
          returnRequest: {
            _id: 'ret_001',
            status: 'inspected'
          }
        })
      } as any;
    };

    const res = await api.returns.seller.inspect('ret_001', {
      itemsInspection: [
        {
          itemId: 'item_01',
          condition: 'passed_resellable',
          disposition: 'restocked',
          notes: 'Tested functional, packaging intact'
        }
      ],
      generalNotes: 'Passed diagnostics'
    });

    assert.equal(capturedBody.itemsInspection[0].condition, 'passed_resellable');
    assert.equal(capturedBody.itemsInspection[0].disposition, 'restocked');
    assert.equal(res.returnRequest.status, 'inspected');
  });

  await t.test('5. api.returns.admin.confirmCODTransfer records bank reference UTR and marks completed', async () => {
    let capturedBody: any = null;
    globalThis.fetch = async (url: any, opts: any) => {
      assert.match(String(url), /\/returns\/admin\/ret_002\/refund\/cod-confirm$/);
      assert.equal(opts.method, 'POST');
      capturedBody = JSON.parse(opts.body);
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({
          message: 'COD bank transfer confirmed successfully',
          returnRequest: {
            _id: 'ret_002',
            status: 'completed',
            refundDetails: {
              status: 'completed',
              bankReferenceNumber: capturedBody.bankReferenceNumber
            }
          }
        })
      } as any;
    };

    const res = await api.returns.admin.confirmCODTransfer('ret_002', {
      bankReferenceNumber: 'UTR998877665544',
      notes: 'NEFT corporate settlement'
    });

    assert.equal(capturedBody.bankReferenceNumber, 'UTR998877665544');
    assert.equal(res.returnRequest.refundDetails.status, 'completed');
  });

  // Restore original fetch
  globalThis.fetch = originalFetch;
});
