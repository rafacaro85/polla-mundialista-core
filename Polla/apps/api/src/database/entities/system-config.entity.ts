import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'system_config' })
export class SystemConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    key: string;

    @Column({ type: 'text' })
    value: string;
}
