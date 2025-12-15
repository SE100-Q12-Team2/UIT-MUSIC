import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { GoogleService } from './google.service'
import { FacebookService } from './facebook.service'
import { SendOTPBodyDTO, RegisterBodyDTO, LoginBodyDTO } from './auth.dto'
import { TypeOfVerificationCode } from 'src/shared/constants/auth.constant'
import { BadRequestException, UnprocessableEntityException } from '@nestjs/common'
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

  const mockGoogleService = { getGoogleLink: jest.fn(), handleGoogleCallback: jest.fn() }
  const mockFacebookService = { getFacebookLink: jest.fn(), handleFacebookCallback: jest.fn() }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: GoogleService, useValue: mockGoogleService },
        { provide: FacebookService, useValue: mockFacebookService },
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
      allure.story('Send OTP Decision Table Coverage');
    });

    // --- UTCID01: Happy Path (Register) ---
    it('[UTCID01] Nên gửi OTP thành công khi đăng ký email chưa tồn tại', async () => {
      allure.severity('critical');
      allure.description('Case: Email chưa có trong DB, Type = REGISTER -> Expect: 200 OK');
      
      const sendOTPDto: SendOTPBodyDTO = {
        email: 'nguyenloc24022005@gmail.com',
        type: TypeOfVerificationCode.REGISTER,
      }
      const expectedResult = { message: 'Registration verification code sent successfully' }

      mockAuthService.sendOTP.mockResolvedValue(expectedResult)

      const result = await controller.sendOTP(sendOTPDto)

      expect(authService.sendOTP).toHaveBeenCalledWith(sendOTPDto)
      expect(result).toEqual(expectedResult)
    })

    // --- UTCID02: Fail (Register - Email Exists) ---
    it('[UTCID02] Nên ném lỗi 400 khi đăng ký với email đã tồn tại', async () => {
      allure.severity('normal');
      allure.description('Case: Email đã có trong DB, Type = REGISTER -> Expect: 400 Bad Request (EmailAlreadyExists)');

      const sendOTPDto: SendOTPBodyDTO = {
        email: 'exists@gmail.com',
        type: TypeOfVerificationCode.REGISTER,
      }

      mockAuthService.sendOTP.mockRejectedValue(
        new BadRequestException('Email already exists')
      )

      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow(BadRequestException);
      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow('Email already exists');
    })

    // --- UTCID03: Fail (Invalid Email Format) ---
    it('[UTCID03] Nên ném lỗi 400 khi email sai định dạng', async () => {
      allure.severity('minor');
      allure.description('Case: Email invalid (abc123) -> Expect: 400 Bad Request (ValidateException)');

      const sendOTPDto: SendOTPBodyDTO = {
        email: 'abc123_invalid_email',
        type: TypeOfVerificationCode.REGISTER,
      }

      mockAuthService.sendOTP.mockRejectedValue(
        new BadRequestException('Invalid email address')
      )

      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow(BadRequestException);
      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow('Invalid email address');
    })

    // --- UTCID05: Fail (Forgot Password - Email Not Found) ---
    it('[UTCID05] Nên ném lỗi 422 khi quên mật khẩu với email không tồn tại', async () => {
      allure.severity('normal');
      allure.description('Case: Email chưa có trong DB, Type = FORGOT_PASSWORD -> Expect: 422 Unprocessable Entity');

      const sendOTPDto: SendOTPBodyDTO = {
        email: 'notfound@gmail.com',
        type: TypeOfVerificationCode.FORGOT_PASSWORD,
      }

      mockAuthService.sendOTP.mockRejectedValue(
        new UnprocessableEntityException('Email does not exist')
      )

      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow(UnprocessableEntityException);
      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow('Email does not exist');
    })

    // --- UTCID06 & UTCID07: Fail (Invalid Type) ---
    it('[UTCID06/07] Nên ném lỗi 400 khi loại xác thực không hợp lệ', async () => {
      allure.severity('minor');
      allure.description('Case: Type invalid hoặc rỗng -> Expect: 400 Bad Request');

      const sendOTPDto: SendOTPBodyDTO = {
        email: 'valid@gmail.com',
        type: 'INVALID_TYPE' as any,
      }

      mockAuthService.sendOTP.mockRejectedValue(
        new BadRequestException('Invalid verification type')
      )

      await expect(controller.sendOTP(sendOTPDto)).rejects.toThrow(BadRequestException);
    })
  })

  describe('Register', () => {
    beforeAll(() => {
      allure.epic('Authentication');
      allure.feature('User Registration');
      allure.story('Register Decision Table Coverage (UTCID 01-15)');
    });

    // --- UTCID01: Happy Path ---
    it('[UTCID01] Đăng ký thành công với dữ liệu hợp lệ (201 Created)', async () => {
      allure.severity('blocker');
      allure.description('Case: Tất cả dữ liệu hợp lệ -> Expect: 201 Created');
      
      const registerDto: RegisterBodyDTO = {
        email: 'nguyenloc24022005@gmail.com',
        password: 'Password123@!',
        confirmPassword: 'Password123@!',
        fullName: 'Jane Doe',
        code: '123456',
      }

      const expectedResult = {
        id: 1,
        email: registerDto.email,
        fullName: registerDto.fullName,
        roleId: 2,
        accountStatus: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        dateOfBirth: null,
        profilePicture: null,
        bio: null,
        country: null,
      }

      mockAuthService.register.mockResolvedValue(expectedResult)

      const result = await controller.register(registerDto)

      expect(authService.register).toHaveBeenCalledWith(registerDto)
      expect(result).toEqual(expectedResult)
    })

    // --- UTCID02: Email Exists ---
    it('[UTCID02] Đăng ký thất bại do Email đã tồn tại (422 Unprocessable Entity)', async () => {
      allure.severity('critical');
      allure.description('Case: Email exists in DB -> Expect: 422 Unprocessable Entity');

      const registerDto: RegisterBodyDTO = {
        email: 'exists@gmail.com',
        password: 'Password123@!',
        confirmPassword: 'Password123@!',
        fullName: 'Jane Doe',
        code: '123456',
      }

      mockAuthService.register.mockRejectedValue(
        new UnprocessableEntityException('Email already exists')
      )

      await expect(controller.register(registerDto)).rejects.toThrow(UnprocessableEntityException);
      await expect(controller.register(registerDto)).rejects.toThrow('Email already exists');
    })

    // --- UTCID03, 04: Invalid Email ---
    it('[UTCID03, 04] Đăng ký thất bại do Email rỗng hoặc sai định dạng (400 Bad Request)', async () => {
      allure.severity('normal');
      const registerDto: RegisterBodyDTO = {
        email: 'abc123_invalid',
        password: 'Password123@!',
        confirmPassword: 'Password123@!',
        fullName: 'Jane Doe',
        code: '123456',
      }

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Invalid email format')
      )

      await expect(controller.register(registerDto)).rejects.toThrow(BadRequestException);
    })

    // --- UTCID05, 06, 07, 08, 09: Invalid Password ---
    it('[UTCID05-09] Đăng ký thất bại do Mật khẩu không hợp lệ (Rỗng, Ngắn, Đơn giản, Quá dài) (400 Bad Request)', async () => {
      allure.severity('normal');
      allure.description('Cover các case: Empty, Short, Weak, Too Long password');

      const registerDto: RegisterBodyDTO = {
        email: 'valid@gmail.com',
        password: 'abc',
        confirmPassword: 'abc',
        fullName: 'Jane Doe',
        code: '123456',
      }

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Password must be strong...')
      )

      await expect(controller.register(registerDto)).rejects.toThrow(BadRequestException);
    })

    // --- UTCID10: Confirm Password Mismatch ---
    it('[UTCID10] Đăng ký thất bại do Mật khẩu xác nhận không khớp (400 Bad Request)', async () => {
      allure.severity('critical');
      
      const registerDto: RegisterBodyDTO = {
        email: 'valid@gmail.com',
        password: 'Password123@!',
        confirmPassword: 'MismatchPassword!!!',
        fullName: 'Jane Doe',
        code: '123456',
      }

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Passwords do not match')
      )

      await expect(controller.register(registerDto)).rejects.toThrow(BadRequestException);
      await expect(controller.register(registerDto)).rejects.toThrow('Passwords do not match');
    })

    // --- UTCID11, 12: Invalid FullName ---
    it('[UTCID11, 12] Đăng ký thất bại do Tên hiển thị rỗng hoặc quá ngắn (400 Bad Request)', async () => {
      allure.severity('minor');
      
      const registerDto: RegisterBodyDTO = {
        email: 'valid@gmail.com',
        password: 'Password123@!',
        confirmPassword: 'Password123@!',
        fullName: 'a',
        code: '123456',
      }

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Full name is too short')
      )

      await expect(controller.register(registerDto)).rejects.toThrow(BadRequestException);
    })

    // --- UTCID13: Wrong OTP ---
    it('[UTCID13] Đăng ký thất bại do Mã OTP không khớp (400 Bad Request)', async () => {
      allure.severity('critical');
      
      const registerDto: RegisterBodyDTO = {
        email: 'valid@gmail.com',
        password: 'Password123@!',
        confirmPassword: 'Password123@!',
        fullName: 'Jane Doe',
        code: '000000',
      }

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Invalid OTP')
      )

      await expect(controller.register(registerDto)).rejects.toThrow(BadRequestException);
    })

    // --- UTCID14: Expired OTP ---
    it('[UTCID14] Đăng ký thất bại do Mã OTP đã hết hạn (400 Bad Request)', async () => {
      allure.severity('critical');
      
      const registerDto: RegisterBodyDTO = {
        email: 'valid@gmail.com',
        password: 'Password123@!',
        confirmPassword: 'Password123@!',
        fullName: 'Jane Doe',
        code: '123456',
      }

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('OTP has expired')
      )

      await expect(controller.register(registerDto)).rejects.toThrow(BadRequestException);
    })

    // --- UTCID15: Invalid OTP Format ---
    it('[UTCID15] Đăng ký thất bại do Mã OTP sai định dạng (400 Bad Request)', async () => {
      allure.severity('minor');
      
      const registerDto: RegisterBodyDTO = {
        email: 'valid@gmail.com',
        password: 'Password123@!',
        confirmPassword: 'Password123@!',
        fullName: 'Jane Doe',
        code: '12345',
      }

      mockAuthService.register.mockRejectedValue(
        new BadRequestException('Invalid verification code format')
      )

      await expect(controller.register(registerDto)).rejects.toThrow(BadRequestException);
    })
  })

  describe('Login', () => {
    beforeAll(() => {
      allure.epic('Authentication');
      allure.feature('User Login');
      allure.story('Login Decision Table Coverage (UTCID 01-07)');
    });

    const userAgent = 'Mozilla/5.0...';
    const userIp = '127.0.0.1';

    // --- UTCID01: Happy Path (Normal Login) ---
    it('[UTCID01] Đăng nhập thành công với Email và Password đúng (200 OK)', async () => {
      allure.severity('blocker');
      allure.description('Case: Normal Login -> Expect: 200 OK with Tokens');

      const loginDto: LoginBodyDTO = {
        email: 'test@gmail.com',
        password: '123123123',
      }

      const expectedResult = {
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-xyz',
      }

      mockAuthService.login.mockResolvedValue(expectedResult)

      const result = await controller.login(loginDto, userAgent, userIp)

      expect(authService.login).toHaveBeenCalledWith({
        ...loginDto,
        userAgent,
        ip: userIp,
      })
      expect(result).toEqual(expectedResult)
    })

    // --- UTCID02: Empty Email ---
    it('[UTCID02] Đăng nhập thất bại do Email rỗng (400 Bad Request)', async () => {
      allure.severity('normal');
      allure.description('Case: Empty Email -> Expect: 400 Bad Request (ValidateException)');

      const loginDto: LoginBodyDTO = {
        email: '',
        password: '123123123',
      }

      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Invalid email address')
      )

      await expect(controller.login(loginDto, userAgent, userIp)).rejects.toThrow(BadRequestException);
      await expect(controller.login(loginDto, userAgent, userIp)).rejects.toThrow('Invalid email address');
    })

    // --- UTCID03: Invalid Email Format ---
    it('[UTCID03] Đăng nhập thất bại do Email sai định dạng (400 Bad Request)', async () => {
      allure.severity('normal');
      allure.description('Case: Invalid Email Format (abc123) -> Expect: 400 Bad Request');

      const loginDto: LoginBodyDTO = {
        email: 'abc123_invalid',
        password: '123123123',
      }

      mockAuthService.login.mockRejectedValue(
        new BadRequestException('Invalid email address')
      )

      await expect(controller.login(loginDto, userAgent, userIp)).rejects.toThrow(BadRequestException);
    })

    // --- UTCID04: User Not Found ---
    it('[UTCID04] Đăng nhập thất bại do Email không tồn tại (422 Unprocessable Entity)', async () => {
      allure.severity('critical');
      allure.description('Case: User not found -> Expect: 422 Unprocessable Entity');

      const loginDto: LoginBodyDTO = {
        email: 'ablkasjd@gmail.com',
        password: '123123123',
      }

      mockAuthService.login.mockRejectedValue(
        new UnprocessableEntityException('Email does not exist')
      )

      await expect(controller.login(loginDto, userAgent, userIp)).rejects.toThrow(UnprocessableEntityException);
      await expect(controller.login(loginDto, userAgent, userIp)).rejects.toThrow('Email does not exist');
    })

    // --- UTCID05: Wrong Password ---
    it('[UTCID05] Đăng nhập thất bại do sai mật khẩu (422 Unprocessable Entity)', async () => {
      allure.severity('critical');
      allure.description('Case: Wrong Password -> Expect: 422 Unprocessable Entity (theo bảng Decision Table)');

      const loginDto: LoginBodyDTO = {
        email: 'test@gmail.com',
        password: 'jpassfaer123',
      }

      mockAuthService.login.mockRejectedValue(
        new UnprocessableEntityException('Password is not correct')
      )

      await expect(controller.login(loginDto, userAgent, userIp)).rejects.toThrow(UnprocessableEntityException);
      await expect(controller.login(loginDto, userAgent, userIp)).rejects.toThrow('Password is not correct');
    })

    // --- UTCID06: Empty Password ---
    it('[UTCID06] Đăng nhập thất bại do mật khẩu rỗng (422 Unprocessable Entity)', async () => {
      allure.severity('normal');
      allure.description('Case: Empty Password -> Expect: 422 Unprocessable Entity');

      const loginDto: LoginBodyDTO = {
        email: 'test@gmail.com',
        password: '', // Empty
      }

      // Theo bảng: ValidateException được check, và Response 422 được check
      mockAuthService.login.mockRejectedValue(
        new UnprocessableEntityException('Password should not be empty')
      )

      await expect(controller.login(loginDto, userAgent, userIp)).rejects.toThrow(UnprocessableEntityException);
    })
  })
})