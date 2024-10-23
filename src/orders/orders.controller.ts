import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}


  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }


  //get all orders with filters
  @MessagePattern('findAllOrders')
  findAll(@Payload() orderPaginationDto : OrderPaginationDto) 
  {
    return this.ordersService.findAll(orderPaginationDto);
  }


  //get one order by ID
  @MessagePattern('findOneOrder')
  findOne(@Payload('id') id: string) 
  {
    return this.ordersService.findOne(id);
  }


  @MessagePattern('changeOrderStatus')
  changeOrderStatus()
  {
    // return this.ordersService.changeStatus
  }
}
