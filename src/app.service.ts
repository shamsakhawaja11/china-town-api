import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}
  
  async get():Promise<any>{
    const res = await this.prisma.$queryRaw `select 1 `;
    return res;
  }
}
