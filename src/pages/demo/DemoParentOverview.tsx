import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { demoStudents } from '@/data/demoData';

export default function DemoParentOverview() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // In demo mode, we use the first few demo students as "children"
    const children = demoStudents.slice(0, 2);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {t('demo.parentOverview')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('parent.overviewDescription')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="px-3 py-1">
                        <Eye className="w-3 h-3 mr-1" /> {t('demo.viewOnly')}
                    </Badge>
                    <Button disabled variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('parent.addChild')}
                    </Button>
                </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full mt-0.5">
                    <Eye className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-medium text-primary">{t('demo.welcome', { role: 'Parent' })}</p>
                    <p className="text-xs text-muted-foreground">{t('demo.description')}</p>
                </div>
            </div>

            {/* Children Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map((child) => (
                    <Card
                        key={child.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(`/demo/parent/children/${child.id}`)}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <Avatar className="w-16 h-16">
                                    <AvatarImage src={child.avatar_url || undefined} alt={child.name} />
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
                                        {t('parent.linkedOn')}: {new Date().toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t">
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/demo/parent/children/${child.id}`);
                                    }}
                                >
                                    {t('parent.viewProgress')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Locked Feature Preview */}
                <Card className="border-dashed flex items-center justify-center p-6 bg-muted/30">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                            <Plus className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">{t('parent.addChild')}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t('demo.viewOnlyDesc')}</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
