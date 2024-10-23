import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit
{
  private readonly logger = new Logger('ORDER_SERVICE');
  
  async onModuleInit() 
  {
    await this.$connect();
    this.logger.log(`Database Connected!`);
  }


  create(createOrderDto: CreateOrderDto) 
  {
    return this.order.create({
      data : createOrderDto
    });
  }


  async findAll(orderPaginationDto : OrderPaginationDto) 
  {
    const totalPages = await this.order.count({
      where : { status : orderPaginationDto.status}
    });

    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;



    return {
      data : await this.order.findMany({
        skip : (currentPage -1) * perPage,
        take : perPage,
        where : 
        {
          status : orderPaginationDto.status
        }
      }),
      meta : {
        total : totalPages,
        page : currentPage,
        lastPage : Math.ceil(totalPages/perPage)
      }
    }
  }


  async findOne(id: string) 
  {
    const getOrder = await this.order.findFirst({
      where : {id} 
    });

    if(!getOrder)
    {
      throw new RpcException
      ({
        message : `Order with id ${id} not found`,
        status : HttpStatus.NOT_FOUND
      });
    }
    return getOrder;
  }


}