import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';

@ApiTags('Admin Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('api/admin/orders')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async getAllOrders(
    @Query('status') status: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    const data = await this.orderService.findAllForAdmin({ status, page, limit });
    return { success: true, statusCode: 200, message: 'success', data };
  }

  @Get(':id')
  async getOrderDetail(@Param('id') id: string) {
    const data = await this.orderService.findOne(+id); // Trả về kèm User và OrderItems
    return { success: true, statusCode: 200, message: 'success', data };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    const data = await this.orderService.updateStatusByAdmin(+id, dto);
    return { success: true, statusCode: 200, message: 'success', data };
  }
}