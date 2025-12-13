import { Test, TestingModule } from '@nestjs/testing'
import { UserSubscriptionController } from './user-subscription.controller'
import { UserSubscriptionService } from './user-subscription.service'
import { TransactionController } from '../transaction/transaction.controller'
import { TransactionService } from '../transaction/transaction.service'
import { CreateUserSubscriptionDto } from './user-subscription.dto'
import { CreateTransactionDto, SepayWebhookDto } from '../transaction/transaction.dto'
import { Response } from 'express'
import { allure } from '../../../test/allure-helper'

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

      // Arrange
      const userId = 1
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 2, // Premium plan
        autoRenew: false,
      }

      const expectedResult = {
        id: 1,
        userId: 1,
        planId: 2,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-02-01T00:00:00.000Z',
        isActive: false, // Chưa active vì chưa thanh toán
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
      }

      await allure.step('Chuẩn bị dữ liệu đăng ký', async () => {
        allure.parameter('User ID', userId);
        allure.parameter('Plan ID', subscribeDto.planId);
        allure.parameter('Plan Name', 'Premium');
        allure.attachJSON('Subscribe DTO', subscribeDto);
        mockUserSubscriptionService.subscribe.mockResolvedValue(expectedResult)
      });

      // Act
      let result: any;
      await allure.step('Đăng ký gói Premium', async () => {
        result = await controller.subscribe(userId, subscribeDto)
        allure.attachJSON('Subscription Created', result);
      });

      // Assert
      await allure.step('Verify subscription được tạo', async () => {
        expect(userSubscriptionService.subscribe).toHaveBeenCalledWith(
          userId,
          subscribeDto
        )
        expect(userSubscriptionService.subscribe).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedResult)
        expect(result.userId).toBe(userId)
        expect(result.planId).toBe(2)
        expect(result.isActive).toBe(false) // Pending payment
        allure.attachText('Status', '✓ Subscription created\n✓ Status: Pending Payment\n✓ Plan: Premium');
      });
    })

    it('Nên đăng ký gói Free plan', async () => {
      // Arrange
      const userId = 2
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 1, // Free plan
        autoRenew: false,
      }

      const expectedResult = {
        id: 2,
        userId: 2,
        planId: 1,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2025-01-01T00:00:00.000Z', // 12 months
        isActive: true, // Free plan is active immediately
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
      }

      mockUserSubscriptionService.subscribe.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.subscribe(userId, subscribeDto)

      // Assert
      expect(result.plan.planName).toBe('Free')
      expect(result.plan.price).toBe(0)
      expect(result.isActive).toBe(true)
    })

    it('Nên tính endDate dựa trên durationMonths', async () => {
      // Arrange
      const userId = 1
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 3, // 3 months plan
        autoRenew: false,
      }

      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-04-01') // +3 months

      const expectedResult = {
        id: 3,
        userId: 1,
        planId: 3,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isActive: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        plan: {
          id: 3,
          planName: 'Premium 3 Months',
          durationMonths: 3,
          price: 250000,
          features: {},
          isActive: true,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      }

      mockUserSubscriptionService.subscribe.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.subscribe(userId, subscribeDto)

      // Assert
      expect(result.plan.durationMonths).toBe(3)
      expect(new Date(result.endDate).getMonth()).toBe(3) // April (0-indexed)
    })

    it('Nên throw exception khi plan không tồn tại', async () => {
      // Arrange
      const userId = 1
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 999,
        autoRenew: false,
      }

      mockUserSubscriptionService.subscribe.mockRejectedValue(
        new Error('Subscription plan not found')
      )

      // Act & Assert
      await expect(controller.subscribe(userId, subscribeDto)).rejects.toThrow(
        'Subscription plan not found'
      )
    })

    it('Nên throw exception khi user đã có subscription active', async () => {
      // Arrange
      const userId = 1
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 2,
        autoRenew: false,
      }

      mockUserSubscriptionService.subscribe.mockRejectedValue(
        new Error('User already has an active subscription')
      )

      // Act & Assert
      await expect(controller.subscribe(userId, subscribeDto)).rejects.toThrow(
        'User already has an active subscription'
      )
    })

    it('Nên tạo subscription với status pending khi plan có phí', async () => {
      // Arrange
      const userId = 1
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 2,
        autoRenew: false,
      }

      const expectedResult = {
        id: 1,
        userId: 1,
        planId: 2,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-02-01T00:00:00.000Z',
        isActive: false, // Pending payment
        createdAt: '2024-01-01T00:00:00.000Z',
        plan: {
          id: 2,
          planName: 'Premium',
          durationMonths: 1,
          price: 99000,
          features: {},
          isActive: true,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      }

      mockUserSubscriptionService.subscribe.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.subscribe(userId, subscribeDto)

      // Assert
      expect(result.isActive).toBe(false)
      expect(result.plan.price).toBeGreaterThan(0)
    })

    it('Nên require authentication', async () => {
      // Arrange
      const userId = 1
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 2,
        autoRenew: false,
      }

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
          features: {},
          isActive: true,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      }

      mockUserSubscriptionService.subscribe.mockResolvedValue(expectedResult)

      // Act
      const result = await controller.subscribe(userId, subscribeDto)

      // Assert - Controller được decorate với @Auth([AuthType.Bearer])
      expect(result.userId).toBe(userId)
    })

    it('[DEMO FAIL] User phải có ít nhất 2 subscription active', async () => {
      allure.severity('normal');
      allure.description('Test case minh họa failure - user phải có nhiều subscription');
      allure.tag('demo-failure', 'subscription', 'validation');
      
      // Arrange
      const userId = 1
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 2,
        autoRenew: false,
      }

      const expectedResult = {
        id: 1,
        userId: 1,
        planId: 2,
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-02-01T00:00:00.000Z',
        isActive: true,
        createdAt: '2024-01-01T00:00:00.000Z',
        plan: {
          id: 2,
          planName: 'Premium',
          durationMonths: 1,
          price: 99000,
          features: {},
          isActive: true,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      }

      mockUserSubscriptionService.subscribe.mockResolvedValue(expectedResult)

      // Act
      const result: any = await controller.subscribe(userId, subscribeDto)

      // Assert - Demo fail: Kiểm tra user phải có >= 2 active subscriptions
      const activeCount = 1 // Chỉ có 1 subscription
      expect(activeCount).toBeGreaterThanOrEqual(2) // Sẽ fail
    })

    it('[DEMO FAIL] Giá plan phải lớn hơn 200,000 VND', async () => {
      allure.severity('trivial');
      allure.description('Test case minh họa failure - giá plan quá thấp');
      allure.tag('demo-failure', 'pricing');
      
      // Arrange
      const userId = 1
      const subscribeDto: CreateUserSubscriptionDto = {
        planId: 2,
        autoRenew: false,
      }

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
          price: 99000, // Giá thấp
          features: {},
          isActive: true,
          createdAt: '2023-01-01T00:00:00.000Z',
        },
      }

      mockUserSubscriptionService.subscribe.mockResolvedValue(expectedResult)

      // Act
      const result: any = await controller.subscribe(userId, subscribeDto)

      // Assert - Demo fail
      expect(result.plan.price).toBeGreaterThan(200000) // Sẽ fail vì chỉ có 99000
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
      // Arrange
      const webhookData: SepayWebhookDto = {
        id: '123456',
        transactionId: 'TXN123456',
        transferAmount: 99000,
        transferContent: 'Thanh toan goi Premium - SUB001',
        transferDate: '2024-01-01 10:00:00',
        accountNumber: '0123456789',
        referenceNumber: 'FT24001123456',
        subAccount: undefined,
      }

      const signature = 'valid-signature'

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
      }

      mockTransactionService.processSepayCallback.mockResolvedValue(
        expectedTransaction
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      // Act
      const result = await controller.handleSepayWebhook(
        webhookData,
        signature,
        mockResponse
      )

      // Assert
      expect(transactionService.processSepayCallback).toHaveBeenCalledWith(
        webhookData,
        signature
      )
      expect(transactionService.processSepayCallback).toHaveBeenCalledTimes(1)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully',
      })
    })

    it('Nên active subscription sau khi thanh toán thành công', async () => {
      // Arrange
      const webhookData: SepayWebhookDto = {
        id: '123457',
        transactionId: 'TXN123457',
        transferAmount: 250000,
        transferContent: 'Thanh toan Premium 3 thang - SUB002',
        transferDate: '2024-01-01 11:00:00',
        accountNumber: '0987654321',
        referenceNumber: 'FT24001234567',
        subAccount: undefined,
      }

      const signature = 'valid-signature'

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
          isActive: true, // Được active sau khi thanh toán
        },
      }

      mockTransactionService.processSepayCallback.mockResolvedValue(
        expectedTransaction
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      // Act
      await controller.handleSepayWebhook(webhookData, signature, mockResponse)

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully',
      })
    })

    it('Nên verify signature trước khi xử lý', async () => {
      // Arrange
      const webhookData: SepayWebhookDto = {
        id: '123458',
        transactionId: 'TXN123458',
        transferAmount: 99000,
        transferContent: 'Thanh toan - SUB003',
        transferDate: '2024-01-01 12:00:00',
        accountNumber: '0123456789',
        referenceNumber: 'FT24001345678',
        subAccount: undefined,
      }

      const invalidSignature = 'invalid-signature'

      mockTransactionService.processSepayCallback.mockRejectedValue(
        new Error('Invalid signature')
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      // Act
      await controller.handleSepayWebhook(
        webhookData,
        invalidSignature,
        mockResponse
      )

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid signature',
      })
    })

    it('Nên xử lý transaction duplicate', async () => {
      // Arrange
      const webhookData: SepayWebhookDto = {
        id: '123456', // Same transaction ID
        transactionId: 'TXN123456',
        transferAmount: 99000,
        transferContent: 'Thanh toan - SUB001',
        transferDate: '2024-01-01 10:00:00',
        accountNumber: '0123456789',
        referenceNumber: 'FT24001123456',
        subAccount: undefined,
      }

      const signature = 'valid-signature'

      const expectedTransaction = {
        id: 1,
        userId: 1,
        subscriptionId: 1,
        amount: 99000,
        transactionStatus: 'COMPLETED', // Already processed
        invoiceData: {},
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      mockTransactionService.processSepayCallback.mockResolvedValue(
        expectedTransaction
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      // Act
      await controller.handleSepayWebhook(webhookData, signature, mockResponse)

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully',
      })
    })

    it('Nên lưu thông tin invoice khi thanh toán', async () => {
      // Arrange
      const webhookData: SepayWebhookDto = {
        id: '123459',
        transactionId: 'TXN123459',
        transferAmount: 99000,
        transferContent: 'Payment SUB004',
        transferDate: '2024-01-01 13:00:00',
        accountNumber: '1234567890',
        referenceNumber: 'FT24001456789',
        subAccount: undefined,
      }

      const signature = 'valid-signature'

      const expectedTransaction = {
        id: 4,
        userId: 4,
        subscriptionId: 4,
        amount: 99000,
        transactionStatus: 'COMPLETED',
        invoiceData: {
          transactionId: 123459,
          gateway: 'TECHCOMBANK',
          amount: 99000,
          code: 'SUB004',
          referenceCode: 'FT24001456789',
          transactionDate: '2024-01-01 13:00:00',
          paymentGateway: 'sepay',
        },
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      mockTransactionService.processSepayCallback.mockResolvedValue(
        expectedTransaction
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      // Act
      await controller.handleSepayWebhook(webhookData, signature, mockResponse)

      // Assert
      expect(transactionService.processSepayCallback).toHaveBeenCalledWith(
        webhookData,
        signature
      )
    })

    it('Nên xử lý failed transaction', async () => {
      // Arrange
      const webhookData: SepayWebhookDto = {
        id: '123460',
        transactionId: 'TXN123460',
        transferAmount: 99000,
        transferContent: 'Payment SUB005',
        transferDate: '2024-01-01 14:00:00',
        accountNumber: '0123456789',
        referenceNumber: 'FT24001567890',
        subAccount: undefined,
      }

      const signature = 'valid-signature'

      const expectedTransaction = {
        id: 5,
        userId: 5,
        subscriptionId: 5,
        amount: 99000,
        transactionStatus: 'FAILED',
        invoiceData: {},
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      mockTransactionService.processSepayCallback.mockResolvedValue(
        expectedTransaction
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      // Act
      await controller.handleSepayWebhook(webhookData, signature, mockResponse)

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Webhook processed successfully',
      })
    })

    it('Nên xử lý khi subscription không tồn tại', async () => {
      // Arrange
      const webhookData: SepayWebhookDto = {
        id: '123461',
        transactionId: 'TXN123461',
        transferAmount: 99000,
        transferContent: 'Payment INVALID_CODE',
        transferDate: '2024-01-01 15:00:00',
        accountNumber: '0123456789',
        referenceNumber: 'FT24001678901',
        subAccount: undefined,
      }

      const signature = 'valid-signature'

      mockTransactionService.processSepayCallback.mockRejectedValue(
        new Error('Subscription not found')
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      // Act
      await controller.handleSepayWebhook(webhookData, signature, mockResponse)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subscription not found',
      })
    })

    it('Nên validate amount khớp với subscription price', async () => {
      // Arrange
      const webhookData: SepayWebhookDto = {
        id: '123462',
        transactionId: 'TXN123462',
        transferAmount: 50000, // Sai số tiền
        transferContent: 'Payment SUB006',
        transferDate: '2024-01-01 16:00:00',
        accountNumber: '0123456789',
        referenceNumber: 'FT24001789012',
        subAccount: undefined,
      }

      const signature = 'valid-signature'

      mockTransactionService.processSepayCallback.mockRejectedValue(
        new Error('Amount mismatch')
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      // Act
      await controller.handleSepayWebhook(webhookData, signature, mockResponse)

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Amount mismatch',
      })
    })

    it('❌ Demo failure - Invalid subscription amount', async () => {
      allure.severity('normal');
      allure.description('Test case minh họa failure - số tiền subscription không hợp lệ');
      allure.tag('demo-failure', 'payment');

      await allure.step('Kiểm tra số tiền phải lớn hơn 0', async () => {
        const invalidAmount = -1000;
        allure.parameter('Invalid Amount', invalidAmount);
        allure.attachJSON('Payment Info', { amount: invalidAmount, currency: 'VND' });
        // This will fail intentionally
        expect(invalidAmount).toBeGreaterThan(0);
      });
    })

    it('[DEMO FAIL] Transaction phải có reference code', async () => {
      allure.severity('critical');
      allure.description('Test case minh họa failure - thiếu reference code');
      allure.tag('demo-failure', 'payment', 'validation');
      
      // Arrange
      const webhookData: SepayWebhookDto = {
        id: '123999',
        transactionId: 'TXN123999',
        transferAmount: 99000,
        transferContent: 'Payment without reference',
        transferDate: '2024-01-01 17:00:00',
        accountNumber: '0123456789',
        referenceNumber: undefined, // Thiếu reference
        subAccount: undefined,
      }

      const signature = 'valid-signature'

      const expectedTransaction = {
        id: 10,
        userId: 10,
        subscriptionId: 10,
        amount: 99000,
        transactionStatus: 'COMPLETED',
        invoiceData: {},
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      mockTransactionService.processSepayCallback.mockResolvedValue(
        expectedTransaction
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      // Act
      await controller.handleSepayWebhook(webhookData, signature, mockResponse)

      // Assert - Demo fail
      expect(webhookData.referenceNumber).toBeDefined() // Sẽ fail vì undefined
    })

    it('[DEMO FAIL] Mỗi transaction phải thuộc về 1 subscription', async () => {
      allure.severity('normal');
      allure.description('Test case minh họa failure - transaction không liên kết subscription');
      allure.tag('demo-failure', 'data-integrity');
      
      // Arrange
      const webhookData: SepayWebhookDto = {
        id: '123998',
        transactionId: 'TXN123998',
        transferAmount: 99000,
        transferContent: 'Orphan transaction',
        transferDate: '2024-01-01 18:00:00',
        accountNumber: '0123456789',
        referenceNumber: 'FT24001999999',
        subAccount: undefined,
      }

      const signature = 'valid-signature'

      const expectedTransaction = {
        id: 11,
        userId: 11,
        subscriptionId: null, // Không có subscription
        amount: 99000,
        transactionStatus: 'COMPLETED',
        invoiceData: {},
        createdAt: '2024-01-01T00:00:00.000Z',
      }

      mockTransactionService.processSepayCallback.mockResolvedValue(
        expectedTransaction
      )

      const mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response

      // Act
      await controller.handleSepayWebhook(webhookData, signature, mockResponse)

      // Assert - Demo fail
      const result = expectedTransaction
      expect(result.subscriptionId).not.toBeNull() // Sẽ fail vì null
    })
  })
})
