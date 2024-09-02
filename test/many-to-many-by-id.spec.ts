import { join } from 'path';
import {
  Column,
  DataSource,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

const dbPath = join('db', `${__dirname}.sqlite`);

@Entity()
class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  username: string;
}

@Entity()
class Comment {
  @PrimaryGeneratedColumn()
  id!: string;

  @ManyToMany(() => User)
  @JoinTable({ name: 'CommentTagsRelation' })
  tags!: Promise<User[]>;
}

describe('Test', () => {
  let dataSoure: DataSource;

  let user1: User;
  let user2: User;

  let comment: Comment;

  beforeAll(async () => {
    dataSoure = new DataSource({
      type: 'sqlite',
      database: dbPath,
      logging: true,
      entities: [User, Comment],
      // 개발용
      synchronize: true,
      dropSchema: true,
    });
    await dataSoure.initialize();

    user1 = await dataSoure.getRepository(User).save({ username: 'user1' });
    user2 = await dataSoure.getRepository(User).save({ username: 'user2' });

    comment = new Comment();
    comment.tags = Promise.resolve([user1, user2]);
    comment = await dataSoure.getRepository(Comment).save(comment);
  });

  it('should be true', () => {
    expect(true).toBe(true);
  });

  it('should be able to get tags', async () => {
    expect((await comment.tags).length).toBe(2);
  });

  it('should be update tags only using user id', async () => {
    const userTemp = new User();
    userTemp.id = user1.id;
    // userTemp.username is not initialized;

    comment.tags = Promise.resolve([userTemp]);

    comment = await dataSoure.getRepository(Comment).save(comment);

    expect((await comment.tags).length).toBe(1);
  });
});
