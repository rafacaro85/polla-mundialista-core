import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SystemSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'https://instagram.com/tupolla' })
  instagram: string;

  @Column({ default: 'https://facebook.com/tupolla' })
  facebook: string;

  @Column({ default: 'https://wa.me/123456' })
  whatsapp: string;

  @Column({ default: 'https://tiktok.com/@tupolla' })
  tiktok: string;

  @Column({ default: 'mailto:soporte@tupolla.com' })
  support: string;

  @Column({ default: '/terms' })
  termsUrl: string;

  @Column({ default: '/privacy' })
  privacyUrl: string;

  @Column({ default: 'Copyright © 2026 TuApp. Todos los derechos reservados.' })
  copyright: string;
}
