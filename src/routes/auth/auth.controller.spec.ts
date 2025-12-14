import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { GoogleService } from './google.service'
import { FacebookService } from './facebook.service'
import { SendOTPBodyDTO, RegisterBodyDTO, LoginBodyDTO } from './auth.dto'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'

import { allure } from '../../../test/allure-helper'

describe('AuthController', () => {
  let controller: AuthController
  let authService: AuthService

  const mockAuthService = {
    sendOTP: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  }

  const mockGoogleService = {
    getGoogleLink: jest.fn(),
    handleGoogleCallback: jest.fn(),
  }

  const mockFacebookService = {
    getFacebookLink: jest.fn(),
    handleFacebookCallback: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: GoogleService,
          useValue: mockGoogleService,
        },
        {
          provide: FacebookService,
          useValue: mockFacebookService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('SendOTP', () => {
    beforeAll(() => {
      allure.epic('Authentication');
      allure.feature('OTP Management');
      allure.story('Send OTP to user email');
    });

    it('Gửi mã OTP đến email người dùng để xác thực đăng ký, quên mật khẩu, đăng nhập hoặc vô hiệu hóa 2FA', async () => {
      allure.severity('critical');
      allure.description('Kiểm tra chức năng gửi OTP đến email người dùng cho các mục đích khác nhau');
      allure.tag('otp', 'email', 'verification');
      
      const sendOTPDto: SendOTPBodyDTO = {
        email: 'nguyenloc24022005@gmail.com',
        type: TypeOfVerificationCode.REGISTER,
      }

      const expectedResult = {
        message: 'OTP code sent successfully',
      }

      await allure.step('Chuẩn bị test data và mock service', async () => {
        allure.parameter('Email', sendOTPDto.email);
        allure.parameter('Type', sendOTPDto.type);
        allure.attachJSON('Request DTO', sendOTPDto);
        mockAuthService.sendOTP.mockResolvedValue(expectedResult)
      });

      let result: any;
      await allure.step('Gọi controller.sendOTP', async () => {
        result = await controller.sendOTP(sendOTPDto)
        allure.attachJSON('Response', result);
      });

      await allure.step('Verify kết quả', async () => {
        expect(authService.sendOTP).toHaveBeenCalledWith(sendOTPDto)
        expect(authService.sendOTP).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedResult)
        allure.attachText('Verification', `Service called: 1 time\nResult matches expected`);
      });
    })

    it('Nên gửi OTP cho forgot password', async () => {
      allure.severity('critical');
      
      const sendOTPDto: SendOTPBodyDTO = {
        email: 'test@example.com',
        type: TypeOfVerificationCode.FORGOT_PASSWORD,
      }

      const expectedResult = {
        message: 'OTP code sent successfully',
      }

      mockAuthService.sendOTP.mockResolvedValue(expectedResult)

      const result = await controller.sendOTP(sendOTPDto)

      expect(authService.sendOTP).toHaveBeenCalledWith(sendOTPDto)
      expect(result).toEqual(expectedResult)
    })
  })

  describe('Register', () => {
    beforeAll(() => {
      allure.feature('User Registration');
      allure.story('Register new user account');
    });

    it('Đăng ký tài khoản người dùng mới với email, mật khẩu và xác thực OTP', async () => {
      allure.severity('blocker');
      allure.description('Kiểm tra flow đăng ký tài khoản mới hoàn chỉnh');
      allure.tag('registration', 'auth', 'happy-path');
      
      const registerDto: RegisterBodyDTO = {
        email: 'newuser@example.com',
        password: 'StrongPassword123!',
        confirmPassword: 'StrongPassword123!',
        fullName: 'New User',
        code: '123456',
      }

      const expectedResult = {
        id: 1,
        email: 'newuser@example.com',
        fullName: 'New User',
        roleId: 2,
        accountStatus: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        dateOfBirth: null,
        profilePicture: null,
        bio: null,
        country: null,
      }

      await allure.step('Setup test data và mock', async () => {
        allure.parameter('Email', registerDto.email);
        allure.parameter('Full Name', registerDto.fullName);
        allure.attachJSON('Registration Data', registerDto);
        mockAuthService.register.mockResolvedValue(expectedResult)
      });

      let result: any;
      await allure.step('Call register API', async () => {
        result = await controller.register(registerDto)
        allure.attachJSON('User Created', result);
      });

      await allure.step('Verify registration success', async () => {
        expect(authService.register).toHaveBeenCalledWith(registerDto)
        expect(authService.register).toHaveBeenCalledTimes(1)
        expect(result).toEqual(expectedResult)
        expect(result).not.toHaveProperty('password')
        allure.attachText('Assertions', 
          `- Service called: ✓\n- Result matches: ✓\n- Password excluded: ✓`
        );
      });
    })

    it('Nên throw exception khi mật khẩu không khớp', async () => {
      const registerDto: RegisterBodyDTO = {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        fullName: 'Test User',
        code: '123456',
      }

      mockAuthService.register.mockRejectedValue(
        new Error('Passwords do not match')
      )

      await expect(controller.register(registerDto)).rejects.toThrow(
        'Passwords do not match'
      )
    })
  })

  describe('Login', () => {
    it('Đăng nhập người dùng với email và mật khẩu, trả về access token và refresh token', async () => {
      const loginDto: LoginBodyDTO = {
        email: 'user@example.com',
        password: 'Password123!',
      }

      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      const userIp = '192.168.1.1'

      const expectedResult = {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      }

      mockAuthService.login.mockResolvedValue(expectedResult)

      const result = await controller.login(loginDto, userAgent, userIp)

      expect(authService.login).toHaveBeenCalledWith({
        ...loginDto,
        userAgent,
        ip: userIp,
      })
      expect(authService.login).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedResult)
      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
    })

    it('Nên throw exception khi email không tồn tại', async () => {
      const loginDto: LoginBodyDTO = {
        email: 'notfound@example.com',
        password: 'Password123!',
      }

      mockAuthService.login.mockRejectedValue(
        new Error('Email does not exist')
      )

      await expect(
        controller.login(loginDto, 'user-agent', '127.0.0.1')
      ).rejects.toThrow('Email does not exist')
    })
  })
})
