import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });
    if (!product) return undefined;

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsId = products.map(product => product.id);
    const productList = await this.ormRepository.find({ id: In(productsId) });

    if (productsId.length !== productList.length) {
      throw new AppError('Product not found');
    }

    return productList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsInStoque = await this.findAllById(products);
    const productSubtract = productsInStoque.map(productStoque => {
      const productFind = products.find(
        product => product.id === productStoque.id,
      );

      if (!productFind) {
        throw new AppError('Product not find');
      }
      if (!productFind.quantity) {
        throw new AppError('Invalid Product');
      }

      if (productStoque.quantity < productFind.quantity) {
        throw new AppError('Insufficient product quantity');
      }

      const productInOrder = productStoque;

      productInOrder.quantity -= productFind.quantity;

      return productInOrder;
    });

    await this.ormRepository.save(productSubtract);

    return productSubtract;
  }
}

export default ProductsRepository;
