import { join } from 'path';
import {
  Column,
  DataSource,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

const dbPath = join('db', `${__dirname}.sqlite`);

@Entity('content')
class Content {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  name!: string;
}

@Entity('comment')
class Comment {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  text!: string;

  @ManyToOne(() => Content)
  content: Content;
}

describe('Test', () => {
  let dataSoure: DataSource;

  let targetComment: Comment;
  let targetContent: Content;

  beforeAll(async () => {
    dataSoure = new DataSource({
      type: 'sqlite',
      database: dbPath,
      logging: true,
      entities: [Content, Comment],
      // 개발용
      synchronize: true,
      dropSchema: true,
    });
    await dataSoure.initialize();

    const content = new Content();
    content.name = 'content1';
    await dataSoure.getRepository(Content).save(content);
    targetContent = content;

    const comment = new Comment();
    comment.text = 'comment1';
    comment.content = content;
    await dataSoure.getRepository(Comment).save(comment);
    targetComment = comment;
  });

  it('should be true', () => {
    expect(true).toBe(true);
  });

  it('should join', async () => {
    const commentRepository = dataSoure.getRepository(Comment);
    const comment = await commentRepository
      .createQueryBuilder('comment')
      .innerJoinAndSelect('comment.content', 'content')
      .where('content.id = :id', { id: targetContent.id })
      .getOne();
    expect(comment).toEqual(targetComment);
  });

  it('should not join', async () => {
    const contentRepository = dataSoure.getRepository(Content);
    expect.hasAssertions();
    try {
      const content = await contentRepository
        .createQueryBuilder('content')
        .innerJoinAndSelect('content.comment', 'comment')
        .where('comment.id = :id', { id: targetComment.id })
        .getOne();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
