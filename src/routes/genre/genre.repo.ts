import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/shared/services";
import {
    CreateGenreBodyType,
    CreateGenreResType,
    GetGenreQueryType,
    GetGenresResponseType,
    UpdateGenreBodyType
} from "./genre.model";
import { Prisma } from "@prisma/client";

@Injectable()
export class GenreRepository {
    constructor(private readonly prismaService: PrismaService) { }
    async findAll(query: GetGenreQueryType): Promise<GetGenresResponseType> {
        const where: Prisma.GenreWhereInput = {}
        if (typeof query.isActive === 'boolean') {
            where.isActive = query.isActive
        }

        if (query.q && query.q.trim()) {
            where.genreName = { contains: query.q.trim(), mode: Prisma.QueryMode.insensitive }
        }
        if (query.createdFrom || query.createdTo) {
            where.createdAt = {
                ...(query.createdFrom ? { gte: query.createdFrom } : {}),
                ...(query.createdTo ? { lte: query.createdTo } : {}),
            }
        }

        if (query.updatedFrom || query.updatedTo) {
            where.updatedAt = {
                ...(query.updatedFrom ? { gte: query.updatedFrom } : {}),
                ...(query.updatedTo ? { lte: query.updatedTo } : {}),
            }
        }
        const orderBy: Prisma.GenreOrderByWithRelationInput[] = [{ [query.sort]: query.order }]

        const [data, totalItems] = await this.prismaService.$transaction([
            this.prismaService.genre.findMany({
                where,
                orderBy,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
            this.prismaService.genre.count({ where }),
        ])
        return {
            data,
            page: query.page,
            totalPages: Math.ceil(totalItems / query.limit),
            totalItems,
            limit: query.limit,
        }
    }
    async findById(id: number) {
        const genre = await this.prismaService.genre.findUnique({ where: { id } })
        if (!genre) throw new NotFoundException('Genre not found')
        return genre
    }
    async create(body: CreateGenreBodyType): Promise<CreateGenreResType> {
        return this.prismaService.genre.create({ data: body })
    }

    async update(id: number, body: Partial<UpdateGenreBodyType>) {
        await this.findById(id)
        return this.prismaService.genre.update({
            where: { id },
            data: { ...body },
        })
    }

    async delete(id: number) {
        await this.findById(id)
        await this.prismaService.genre.delete({ where: { id } })
        return { message: 'Genre deleted successfully' }
    }
}