import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { OrderResponseDto } from './dto/order-response.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';


@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
@Controller('api/orders')
export class OrderController {
  constructor(private readonly ordersService: OrderService) {}

  @Post()
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return await this.ordersService.create(req.user.sub, createOrderDto);
  }

  @Get()
  async getMyOrders(
    @Request() req,
    @Query() query: OrderQueryDto
  ) {
    const pagination = await this.ordersService.findAllByUser(req.user.sub, {
      page: query.page || 1,
      limit: query.limit || 10
    });

    return {
        items: pagination.items.map((order) => new OrderResponseDto(order)),
        meta: pagination.meta,
    };
  }

  @Get(':id')
  async getOrderDetail(@Request() req, @Param('id') id: string) {
    const order = await this.ordersService.findOne(+id);

    if (order.user.id !== req.user.id) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }

    return new OrderResponseDto(order);
  }

  @Patch(':id/cancel')
  async cancelOrder(@Request() req, @Param('id') id: string, @Body() cancelOrderDto: CancelOrderDto) {
    return  await this.ordersService.cancelByUser(+id, req.user.sub, cancelOrderDto);
  }
}