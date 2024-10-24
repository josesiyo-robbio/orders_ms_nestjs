import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto } from './dto';
import { PRODUCT_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit
{
  private readonly logger = new Logger('ORDER_SERVICE');

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productsClient : ClientProxy,)
    {
      super();
    }
  
  async onModuleInit() 
  {
    await this.$connect();
    this.logger.log(`Database Connected!`);
  }



  //create a order
  async create(createOrderDto: CreateOrderDto) 
  {
    try 
    {
      const productsIds = createOrderDto.items.map((item) => item.productId);

      const products: any[] = await firstValueFrom(this.productsClient.send({ cmd: 'validate_products' }, productsIds));

      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const product = products.find((product) => product.id === orderItem.productId);
        const price = product ? product.price : 0; 
        const itemTotal = price * orderItem.quantity;
      
        console.log(`Producto ID: ${orderItem.productId}, Cantidad: ${orderItem.quantity}, Precio: ${price}, Subtotal: ${itemTotal}`);
      
        return acc + itemTotal;
      }, 0);
      

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;


      }, 0);

      //transassation db
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find(
                  (product) => product.id === orderItem.productId,
                ).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include : {
          OrderItem : {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          }
        }
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId)
            .name,
        })),
      };


    }
    catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs'
      }
      );
    }
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
      where : {id},
      include : {
        OrderItem : {
          select : {
            price : true,
            quantity : true,
            productId : true
          }
        }
      }
    });

    if(!getOrder)
    {
      throw new RpcException
      ({
        message : `Order with id ${id} not found`,
        status : HttpStatus.NOT_FOUND
      });
    }


    const productsIds = getOrder.OrderItem.map( orderItem => orderItem.productId);

    const products: any[] = await firstValueFrom(this.productsClient.send({ cmd: 'validate_products' }, productsIds));





    return {
      ...getOrder,
      OrderItem : getOrder.OrderItem.map((orderItem) => ({
        ...orderItem,
        name : products.find(product => product.id === orderItem.productId).name
      }))
    };
  }


  async changeStatus(changeOrderStatusDto : ChangeOrderStatusDto)
  {
    const {id, status} = changeOrderStatusDto;

    const order = await this.findOne(id);

    if(order.status === status)
    {
      return order;
    }

    return this.order.update({
      where : {id},
      data : {  status  }
    });
  }


}
