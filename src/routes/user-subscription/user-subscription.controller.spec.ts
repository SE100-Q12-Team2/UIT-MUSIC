import { Test, TestingModule } from '@nestjs/testing';
import { UserSubscriptionController } from './user-subscription.controller';
import { UserSubscriptionService } from './user-subscription.service';
import { TransactionController } from '../transaction/transaction.controller';
import { TransactionService } from '../transaction/transaction.service';
import { CreateUserSubscriptionDto } from './user-subscription.dto';
import { SepayWebhookDto } from '../transaction/transaction.dto';
import { Response } from 'express';
import { allure } from '../../../test/allure-helper';

describe('UserSubscriptionController', () => {
  let controller: UserSubscriptionController
  let userSubscriptionService: UserSubscriptionService

  beforeAll(() => {
    allure.epic('Subscription Management');
    allure.feature('User Subscriptions');
    allure.owner('Payment Team');
  });

  const mockUserSubscriptionService = {
    subscribe: jest.fn(),
    getUserSubscriptions: jest.fn(),
    cancelSubscription: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSubscriptionController],
      providers: [
        {
          provide: UserSubscriptionService,
          useValue: mockUserSubscriptionService,
        },
      ],
    }).compile()

    controller = module.get<UserSubscriptionController>(UserSubscriptionController)
    userSubscriptionService = module.get<UserSubscriptionService>(UserSubscriptionService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('SubscribePlan', () => {
    beforeAll(() => {
      allure.story('Subscribe to Premium or Free plan');
    });

    it('Đăng ký gói subscription (Free/Premium) cho người dùng', async () => {
      allure.severity('blocker');
      allure.description('Kiểm tra chức năng đăng ký gói Premium và tạo subscription mới');
      allure.tag('subscription', 'premium', 'payment');

      const userId = 1;
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 2,
        autoRenew: false,
      };

      const expectedResult = {
        id: 1,
        userId: 1,
        planId: 2,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-02-01T00:00:00.000Z',
        isActive: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        plan: {
          id: 2,
          planName: 'Premium',
          durationMonths: 1,
          price: 99000,
          features: {
            adFree: true,
            highQuality: true,
            offline: true,
          },
          isActive: true,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      };

      await allure.step('Chuẩn bị dữ liệu đăng ký', async () => {
        allure.parameter('User ID', userId);
        allure.parameter('Plan ID', subscribeDto.planId);
        allure.parameter('Plan Name', 'Premium');
        allure.attachJSON('Subscribe DTO', subscribeDto);
        mockUserSubscriptionService.subscribe.mockResolvedValue(expectedResult)
      });

      let result: any;
      await allure.step('Đăng ký gói Premium', async () => {
        result = await controller.subscribe(userId, subscribeDto);
        allure.attachJSON('Subscription Created', result);
      });

      await allure.step('Verify subscription được tạo', async () => {
        expect(userSubscriptionService.subscribe).toHaveBeenCalledWith(
          userId,
          subscribeDto
        );
        expect(userSubscriptionService.subscribe).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedResult);
        expect(result.userId).toBe(userId);
        expect(result.planId).toBe(2);
        expect(result.isActive).toBe(false);
        allure.attachText('Status', '✓ Subscription created\n✓ Status: Pending Payment\n✓ Plan: Premium');
      });
    })

    it('Nên đăng ký gói Free plan', async () => {
      const userId = 2;
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 1,
        autoRenew: false,
      };

      const expectedResult = {
        id: 2,
        userId: 2,
        planId: 1,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2025-01-01T00:00:00.000Z',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        plan: {
          id: 1,
          planName: 'Free',
          durationMonths: 12,
          price: 0,
          features: {
            adFree: false,
            highQuality: false,
            offline: false,
          },
          isActive: true,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      };

      mockUserSubscriptionService.subscribe.mockResolvedValue(expectedResult)

      const result = await controller.subscribe(userId, subscribeDto);
      expect(result.plan.planName).toBe('Free');
      expect(result.plan.price).toBe(0);
      expect(result.isActive).toBe(true);
    })
  })
})

describe('TransactionController', () => {
  let controller: TransactionController
  let transactionService: TransactionService

  const mockTransactionService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    processSepayCallback: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile()

    controller = module.get<TransactionController>(TransactionController)
    transactionService = module.get<TransactionService>(TransactionService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('ProcessPayment', () => {
    it('Xử lý thanh toán cho subscription đang pending', async () => {
      const webhookData: SepayWebhookDto = {
        id: '123456',
        transactionId: 'TXN123456',
        transferAmount: 99000,
        transferContent: 'Thanh toan goi Premium - SUB001',
        transferDate: '2024-01-01 10:00:00',
        accountNumber: '0123456789',
        referenceNumber: 'FT24001123456',
        subAccount: undefined,
      };

      const signature = 'valid-signature';

      const expectedTransaction = {
        id: 1,
        userId: 1,
        subscriptionId: 1,
        amount: 99000,
        transactionStatus: 'COMPLETED',
        invoiceData: {
          transactionId: 123456,
          gateway: 'MBBANK',
          amount: 99000,
          code: 'SUB001',
          referenceCode: 'FT24001123456',
          transactionDate: '2024-01-01 10:00:00',
          paymentGateway: 'sepay',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockTransactionService.processSepayCallback.mockResolvedValue(
        expectedTransaction
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      const result = await controller.handleSepayWebhook(
        webhookData,
        signature,
        mockResponse
      );

      expect(transactionService.processSepayCallback).toHaveBeenCalledWith(
        webhookData,
        signature
      );
      expect(transactionService.processSepayCallback).toHaveBeenCalledTimes(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully',
      });
    })

    it('Nên active subscription sau khi thanh toán thành công', async () => {
      const webhookData: SepayWebhookDto = {
        id: '123457',
        transactionId: 'TXN123457',
        transferAmount: 250000,
        transferContent: 'Thanh toan Premium 3 thang - SUB002',
        transferDate: '2024-01-01 11:00:00',
        accountNumber: '0987654321',
        referenceNumber: 'FT24001234567',
        subAccount: undefined,
      };

      const signature = 'valid-signature';

      const expectedTransaction = {
        id: 2,
        userId: 2,
        subscriptionId: 2,
        amount: 250000,
        transactionStatus: 'COMPLETED',
        invoiceData: {
          transactionId: 123457,
          gateway: 'VIETCOMBANK',
          amount: 250000,
          code: 'SUB002',
          referenceCode: 'FT24001234567',
          transactionDate: '2024-01-01 11:00:00',
          paymentGateway: 'sepay',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
        subscription: {
          isActive: true,
        },
      };

      mockTransactionService.processSepayCallback.mockResolvedValue(
        expectedTransaction
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.handleSepayWebhook(webhookData, signature, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully',
      });
    })
  })
})
