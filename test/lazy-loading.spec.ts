import exp = require('constants');
import { join } from 'path';
import {
  Column,
  DataSource,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

const dbPath = join('db', `${__dirname}.sqlite`);

@Entity('user')
class User {
  @PrimaryGeneratedColumn()
  id!: string;

  @OneToOne(() => Profile, {
    cascade: true,
  })
  @JoinColumn()
  profile!: Promise<Profile>;
}

@Entity('profile')
class Profile {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  thumnail!: string;
}

describe('lazy-loading', () => {
  let dataSoure: DataSource;
  let savedUser: User;

  beforeAll(async () => {
    dataSoure = new DataSource({
      type: 'sqlite',
      database: dbPath,
      logging: true,
      entities: [User, Profile],
      // 개발용
      synchronize: true,
      dropSchema: true,
    });
    await dataSoure.initialize();

    const profile = new Profile();
    profile.thumnail = 'thumnail';
    savedUser = new User();
    savedUser.profile = Promise.resolve(profile);
    savedUser = await dataSoure.getRepository(User).save(savedUser);
  });

  it('dataSource to be defined', () => {
    expect(dataSoure).toBeDefined();
    expect(dataSoure.isInitialized).toBeTruthy();
  });

  it('lazy loading using findOneBy without relation parameter', async () => {
    // 기본 기능 확인
    const foundUser: any = (await dataSoure
      .getRepository(User)
      .findOneBy({ id: savedUser.id }))!;

    expect(foundUser.__profile__).not.toBeDefined();
    await foundUser.profile;
    expect(foundUser.__profile__).toBeDefined();
  });

  it('lazy loading using findOne with relation parameter', async () => {
    const foundByFindOne: any = await dataSoure.getRepository(User).findOne({
      relations: {
        profile: true,
      },
      where: {
        id: savedUser.id,
      },
    });
    expect(foundByFindOne.__profile__).toBeDefined();
    await foundByFindOne.profile;
    expect(foundByFindOne.__profile__).toBeDefined();
  });

  it('lazy loading using query builder with join', async () => {
    // query builder 테스팅
    const foundByQueryBuilder: any = await dataSoure
      .getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where({ id: savedUser.id })
      .getOne();

    expect(foundByQueryBuilder.__profile__).toBeDefined();
    await foundByQueryBuilder.profile;
    expect(foundByQueryBuilder.__profile__).toBeDefined();
  });
});
