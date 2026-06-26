import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { join } from 'path';
import { existsSync } from 'fs';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepository: Repository<Attachment>,
  ) {}

  async getAttachmentPath(id: number): Promise<string> {
    const attachment = await this.attachmentRepository.findOneBy({ id });

    if (!attachment) {
      throw new NotFoundException('Hình ảnh không tồn tại trên hệ thống');
    }

    const absolutePath = join(process.cwd(), attachment.filePath);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException('File vật lý đã bị xóa hoặc không tìm thấy');
    }

    return absolutePath;
  }
}