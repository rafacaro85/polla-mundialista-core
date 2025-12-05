import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { BonusQuestion } from './bonus-question.entity';

@Entity('user_bonus_answers')
export class UserBonusAnswer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @ManyToOne(() => BonusQuestion, { eager: true })
    @JoinColumn({ name: 'questionId' })
    question: BonusQuestion;

    @Column()
    questionId: string;

    @Column()
    answer: string; // Respuesta del usuario (ej: "Lionel Messi")

    @Column({ default: 0 })
    pointsEarned: number; // Puntos ganados (0 hasta que se califique)

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
