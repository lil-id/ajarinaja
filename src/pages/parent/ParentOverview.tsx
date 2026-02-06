/**
 * @fileoverview Parent Overview Page
 * @description Main dashboard for parents showing list of their children
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Loader2 } from 'lucide-react';
import { useParentChildren } from '@/hooks/useParentChildren';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ParentOverview() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { children, isLoading } = useParentChildren();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {t('parent.myChildren')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('parent.overviewDescription')}
                    </p>
                </div>
                <Button onClick={() => navigate('/parent/add-child')}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('parent.addChild')}
                </Button>
            </div>

            {/* Empty State */}
            {children.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Plus className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">
                            {t('parent.noChildrenYet')}
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            {t('parent.noChildrenDescription')}
                        </p>
                        <Button onClick={() => navigate('/parent/add-child')}>
                            <Plus className="w-4 h-4 mr-2" />
                            {t('parent.addFirstChild')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                /* Children Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {children.map((child) => (
                        <Card
                            key={child.user_id}
                            className="hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => navigate(`/parent/children/${child.user_id}`)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <Avatar className="w-16 h-16">
                                        <AvatarImage src={child.avatar_url} alt={child.name} />
                                        <AvatarFallback className="text-lg">
                                            {child.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-lg truncate">
                                            {child.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {child.email}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {t('parent.linkedOn')}: {new Date(child.verified_at).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t">
                                    <Button
                                        className="w-full"
                                        variant="secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/parent/children/${child.user_id}`);
                                        }}
                                    >
                                        {t('parent.viewProgress')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
