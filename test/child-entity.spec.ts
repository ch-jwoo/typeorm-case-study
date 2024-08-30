import { join } from 'path';
import {
  ChildEntity,
  Column,
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';

const dbPath = join('db', 'typeorm-case-study-extends.sqlite');

@Entity('content')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
class Parent {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  text!: string;
}

@ChildEntity()
class Child extends Parent {
  @Column({ type: 'text', nullable: false })
  relativePath!: string;
}

describe('typeorm', () => {
  let dataSoure: DataSource;

  beforeAll(async () => {
    dataSoure = new DataSource({
      type: 'sqlite',
      database: dbPath,
      logging: false,
      entities: [Parent, Child],
      // 개발용
      synchronize: true,
      dropSchema: true,
    });
    await dataSoure.initialize();
  });

  it('dataSource to be defined', () => {
    expect(dataSoure).toBeDefined();
    expect(dataSoure.isInitialized).toBeTruthy();
  });

  it('database normal operation', async () => {
    const child = new Child();
    child.text = 'text1';
    child.relativePath = 'path1';

    expect.assertions(0);
    try {
      await dataSoure.getRepository(Child).save(child);
    } catch (error) {
      expect(error).not.toBeNull();
    }
  });

  it('database do not perform null check on child entity properties', async () => {
    const child = new Child();
    child.text = 'text1';
    child.relativePath = null as unknown as string; // error is not thrown even nullable is false

    expect.assertions(0);
    try {
      await dataSoure.getRepository(Child).save(child);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
