import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);
    if (!customer) {
      throw new AppError('User not exist');
    }

    const productsId = products.map(product => {
      return { id: product.id };
    });

    const ordersProduct = await this.productsRepository.findAllById(productsId);

    const productsInOrder = ordersProduct.map(orderProduct => {
      const customerProduct = products.find(
        product => product.id === orderProduct.id,
      );
      if (!customerProduct) {
        throw new AppError('Product not found');
      }

      return {
        product_id: orderProduct.id,
        quantity: customerProduct.quantity || 0,
        price: orderProduct.price,
      };
    });

    await this.productsRepository.updateQuantity(products);

    const orders = await this.ordersRepository.create({
      customer,
      products: productsInOrder,
    });

    return orders;
  }
}

export default CreateOrderService;
