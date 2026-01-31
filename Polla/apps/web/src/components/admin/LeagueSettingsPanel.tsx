"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Settings, Trash2, Loader2, Copy, Share2,
    AlertTriangle, Save, Gem, Check,
    Edit, Gift, Trophy, Users, BarChart3,
    Palette, Shield, Lock, Eye, X
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";
import LeagueBrandingForm from '@/components/LeagueBrandingForm';
import { LeagueBonusQuestions } from '@/components/LeagueBonusQuestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';
import { EnterpriseLock } from '@/components/admin/EnterpriseLock';
import LeagueAnalyticsPanel from '@/components/admin/LeagueAnalyticsPanel';
import { UserPredictionsDialog } from '@/components/UserPredictionsDialog';

interface Participant {
    user: {
        id: string;
        nickname: string;
        avatarUrl?: string;
    };
    isBlocked?: boolean;
    predictionPoints?: number;
    bracketPoints?: number;
    bonusPoints?: number;
    totalPoints?: number;
}

interface League {
    id: string;
    name: string;
    code: string;
    isAdmin: boolean;
    maxParticipants: number;
    participantCount?: number;
    status?: 'ACTIVE' | 'LOCKED' | 'FINISHED';
    isPaid?: boolean;
    brandingLogoUrl?: string;
    prizeImageUrl?: string;
    prizeDetails?: string;
    welcomeMessage?: string;
    isEnterprise?: boolean;
    isEnterpriseActive?: boolean;
    companyName?: string;
    brandColorPrimary?: string;
    brandColorSecondary?: string;
    type?: string;
    packageType?: string;
    socialInstagram?: string;
    socialFacebook?: string;
    socialWhatsapp?: string;
    socialYoutube?: string;
    socialTiktok?: string;
    socialLinkedin?: string;
    socialWebsite?: string;
}

export function LeagueSettingsPanel({ leagueId, defaultTab = "editar", hideTabs = false }: { leagueId: string, defaultTab?: string, hideTabs?: boolean }) {
    // ... (existing code matches) ...

                                    <LeagueBrandingForm
                                        leagueId={currentLeague.id}
                                        showEnterpriseFields={!!currentLeague.isEnterpriseActive}
                                        packageType={currentLeague.packageType}
                                        initialData={{
                                            brandingLogoUrl: currentLeague.brandingLogoUrl,
                                            prizeImageUrl: currentLeague.prizeImageUrl,
                                            prizeDetails: currentLeague.prizeDetails,
                                            welcomeMessage: currentLeague.welcomeMessage,
                                            isEnterprise: currentLeague.isEnterprise,
                                            companyName: currentLeague.companyName,
                                            brandColorPrimary: currentLeague.brandColorPrimary,
                                            brandColorSecondary: currentLeague.brandColorSecondary,
                                            socialInstagram: currentLeague.socialInstagram,
                                            socialFacebook: currentLeague.socialFacebook,
                                            socialWhatsapp: currentLeague.socialWhatsapp,
                                            socialYoutube: currentLeague.socialYoutube,
                                            socialTiktok: currentLeague.socialTiktok,
                                            socialLinkedin: currentLeague.socialLinkedin,
                                            socialWebsite: currentLeague.socialWebsite
                                        }}
                                        onSuccess={() => {
                                            toast({ title: 'Guardado', description: 'Personalización actualizada.' });
                                            loadLeagueData();
                                        }}
                                    />
                                </div>

                                {hideTabs && (
                                    <div className="border-t border-slate-700 pt-8 mt-8 space-y-6">
                                        <div style={STYLES.card}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase">Estado del Plan</h3>
                                                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20">
                                                    {participants.length} / {currentLeague.maxParticipants} Cupos
                                                </span>
                                            </div>
                                            <Progress value={(participants.length / currentLeague.maxParticipants) * 100} className="h-2 bg-slate-700 mb-4" />

                                            <div className="bg-slate-900 rounded-lg p-4 border border-dashed border-slate-700 text-center">
                                                <p className="text-xs text-slate-400 mb-1">CÓDIGO DE INVITACIÓN</p>
                                                <p className="text-2xl font-mono text-emerald-400 font-bold tracking-widest my-2">{currentLeague.code}</p>
                                                <div className="flex gap-2 justify-center mt-3">
                                                    <Button size="sm" variant="outline" onClick={handleCopyCode} className="border-slate-600 hover:bg-slate-800 text-white">
                                                        {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />} Copiar
                                                    </Button>
                                                    <Button size="sm" className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none"
                                                        onClick={() => {
                                                            const appUrl = window.location.origin;
                                                            const text = `¡Únete a mi polla "${currentLeague.name}"! 🏆\n` +
                                                                `Link: ${appUrl}/invite/${currentLeague.code}\n` +
                                                                `Código: *${currentLeague.code}*`;
                                                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                        }}
                                                    >
                                                        <Share2 className="w-3 h-3 mr-1" /> WhatsApp
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 rounded-xl p-5 border border-emerald-500/30">
                                            <h3 className="text-emerald-400 font-bold uppercase text-sm mb-2 flex items-center gap-2">
                                                <Gift className="w-4 h-4" /> ¿Necesitas más cupos?
                                            </h3>
                                            <p className="text-xs text-slate-300 mb-4">
                                                Solicita una ampliación de tu plan actual para invitar a más amigos.
                                            </p>
                                            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                                onClick={() => {
                                                    const text = `Hola, quiero aumentar el cupo de mi liga "${currentLeague.name}" (Código: ${currentLeague.code}).`;
                                                    window.open(`https://wa.me/573105973421?text=${encodeURIComponent(text)}`, '_blank');
                                                }}
                                            >
                                                Solicitar Ampliación de Cupo
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Danger Zone */}
                                <div className="border border-red-900/50 bg-red-900/10 rounded-xl p-5 mt-12">
                                    <h3 className="text-xs font-bold text-red-500 uppercase flex items-center gap-2 mb-4">
                                        <AlertTriangle className="w-4 h-4" /> Zona de Peligro
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] text-red-300 font-bold uppercase mb-2 block">Transferir Propiedad</label>
                                            <select
                                                className="w-full bg-slate-900 border border-red-900/50 rounded-lg px-3 py-2 text-xs text-white"
                                                onChange={(e) => {
                                                    if (e.target.value) handleTransferOwner(e.target.value);
                                                }}
                                                value=""
                                            >
                                                <option value="" disabled>Seleccionar nuevo admin...</option>
                                                {participants.filter(p => p.user.id !== user?.id).map(p => (
                                                    <option key={p.user.id} value={p.user.id}>{p.user.nickname}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <Button variant="destructive" className="w-full mt-2" onClick={handleDeleteLeague} disabled={loading}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Eliminar Polla Definitivamente
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- BONUS --- */}
                            <TabsContent value="bonus" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <LeagueBonusQuestions leagueId={currentLeague.id} />

                                <div className="border-t border-slate-700 pt-6">
                                    <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-emerald-500" /> Consolidado de Puntos
                                    </h3>
                                    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/30">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-xs text-left">
                                                <thead className="bg-[#1E293B] text-slate-400 font-bold uppercase">
                                                    <tr>
                                                        <th className="p-3">Usuario</th>
                                                        <th className="p-3 text-right">Partidos</th>
                                                        <th className="p-3 text-right">Bonus</th>
                                                        <th className="p-3 text-right text-white">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-700">
                                                    {participants.map((p) => (
                                                        <tr key={p.user.id} className="hover:bg-slate-800/50">
                                                            <td className="p-3 font-medium text-slate-300">{p.user.nickname}</td>
                                                            <td className="p-3 text-right text-slate-400">{p.predictionPoints}</td>
                                                            <td className="p-3 text-right text-emerald-400 font-bold">{p.bonusPoints}</td>
                                                            <td className="p-3 text-right font-bold text-white">{p.totalPoints}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* --- USUARIOS --- */}
                            <TabsContent value="usuarios" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase">Lista de Participantes</h3>
                                    <span className="text-xs text-slate-500">{participants.length} usuarios</span>
                                </div>

                                <div className="space-y-2">
                                    {participants.map((p) => (
                                        <div key={p.user.id} className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border border-slate-600">
                                                    <AvatarImage src={p.user.avatarUrl} />
                                                    <AvatarFallback>{p.user.nickname?.charAt(0) || 'U'}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-bold text-sm text-white flex items-center gap-2">
                                                        {p.user.nickname}
                                                        {p.user.id === user?.id && <span className="bg-amber-500 text-black text-[9px] px-1 rounded font-bold">TU</span>}
                                                        {p.isBlocked && <span className="text-red-500 text-[9px] border border-red-500 px-1 rounded uppercase">Bloqueado</span>}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">ID: {p.user.id.substring(0, 8)}...</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10"
                                                    onClick={() => setSelectedUser({ id: p.user.id, name: p.user.nickname, avatar: p.user.avatarUrl })}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>

                                                {p.user.id !== user?.id && (
                                                    <>
                                                        <Button variant="ghost" size="icon"
                                                            className={`h-8 w-8 ${p.isBlocked ? 'text-green-500' : 'text-amber-500'} hover:bg-slate-800`}
                                                            onClick={() => handleBlockParticipant(p.user.id, p.user.nickname, !!p.isBlocked)}
                                                        >
                                                            {p.isBlocked ? <Shield className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                                        </Button>

                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                                                            onClick={() => handleRemoveParticipant(p.user.id, p.user.nickname)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* --- PLAN --- */}
                            <TabsContent value="plan" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div style={STYLES.card}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase">Estado del Plan</h3>
                                        <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded border border-emerald-500/20">
                                            {participants.length} / {currentLeague.maxParticipants} Cupos
                                        </span>
                                    </div>
                                    <Progress value={(participants.length / currentLeague.maxParticipants) * 100} className="h-2 bg-slate-700 mb-4" />
                                    <div className="bg-slate-900 rounded-lg p-4 border border-dashed border-slate-700 text-center">
                                        <p className="text-xs text-slate-400 mb-1">CÓDIGO DE INVITACIÓN</p>
                                        <p className="text-2xl font-mono text-emerald-400 font-bold tracking-widest my-2">{currentLeague.code}</p>
                                        <div className="flex gap-2 justify-center mt-3">
                                            <Button size="sm" variant="outline" onClick={handleCopyCode} className="border-slate-600 hover:bg-slate-800 text-white">
                                                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />} Copiar
                                            </Button>
                                            <Button size="sm" className="bg-[#25D366] hover:bg-[#128C7E] text-white border-none"
                                                onClick={() => {
                                                    const appUrl = window.location.origin;
                                                    const text = `¡Únete a mi polla "${currentLeague.name}"! 🏆\n` +
                                                        `Link: ${appUrl}/invite/${currentLeague.code}\n` +
                                                        `Código: *${currentLeague.code}*`;
                                                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                                                }}
                                            >
                                                <Share2 className="w-3 h-3 mr-1" /> WhatsApp
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 rounded-xl p-5 border border-emerald-500/30">
                                    <h3 className="text-emerald-400 font-bold uppercase text-sm mb-2 flex items-center gap-2">
                                        <Gift className="w-4 h-4" /> ¿Necesitas más cupos?
                                    </h3>
                                    <p className="text-xs text-slate-300 mb-4">
                                        Solicita una ampliación de tu plan actual para invitar a más amigos.
                                    </p>
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                                        onClick={() => {
                                            const text = `Hola, quiero aumentar el cupo de mi liga "${currentLeague.name}" (Código: ${currentLeague.code}).`;
                                            window.open(`https://wa.me/573105973421?text=${encodeURIComponent(text)}`, '_blank');
                                        }}
                                    >
                                        Solicitar Ampliación de Cupo
                                    </Button>
                                </div>
                                {currentLeague.isPaid && (
                                    <Button variant="outline" className="w-full border-slate-700 text-slate-400 hover:text-white"
                                        onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/leagues/${currentLeague.id}/voucher`, '_blank')}
                                    >
                                        <Copy className="w-3 h-3 mr-2" /> Descargar Comprobante de Pago
                                    </Button>
                                )}
                            </TabsContent>

                            {/* --- ANALYTICS --- */}
                            <TabsContent value="analytics" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {!currentLeague.isEnterpriseActive ? (
                                    <EnterpriseLock featureName="Analítica Avanzada" />
                                ) : (
                                    <LeagueAnalyticsPanel leagueId={currentLeague.id} />
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>

                    {/* MODAL DETALLE USUARIO */}
                    {selectedUser && (
                        <UserPredictionsDialog
                            open={!!selectedUser}
                            onOpenChange={(val) => !val && setSelectedUser(null)}
                            leagueId={currentLeague?.id || ''}
                            userId={selectedUser.id}
                            userName={selectedUser.name}
                            userAvatar={selectedUser.avatar}
                        />
                    )}
                </div>
            ) : null}
        </div>
    );
}