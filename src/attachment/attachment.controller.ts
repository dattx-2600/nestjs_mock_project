import { Controller, Get, Res, Param } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import * as express from 'express';

@Controller('attachment')
export class AttachmentController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get(':id')
  async getAttachment(
    @Param('id') id: string,
    @Res() res: express.Response
  ) {
    const filePath = await this.attachmentService.getAttachmentPath(+id);

    return res.sendFile(filePath);
  }
}
