import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { UpdateCartDto } from './dto/update-cart.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Roles('user')
@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async addOrUpdateCart(@Request() req, @Body() updateCartDto: UpdateCartDto) {
    return await this.cartService.addOrUpdate(req.user.sub, updateCartDto);
  }

  @Delete(':productId')
  async removeCartItem(@Request() req, @Param('productId') productId: string) {
    return await this.cartService.remove(req.user.sub, +productId);
  }

  @Get()
  async getCart(@Request() req) {
    return await this.cartService.getCart(req.user.sub);
  }
}