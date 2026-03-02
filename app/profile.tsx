/**
 * Profile — name, birthday, addictions, sponsor work time.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ChevronRight, Plus, Trash2, User, Clock } from 'lucide-react-native';
import { useIconColors } from '@/lib/iconTheme';
import {
  getProfile,
  saveProfile,
  getAddictions,
  addAddiction,
  updateAddiction,
  deleteAddiction,
  getSponsorWorkTimeMinutes,
  setSponsorWorkTimeMinutes,
  type Profile,
  type Addiction,
} from '@/lib/profile';
import { PrivacyGate } from '@/components/PrivacyGate';

export default function ProfileScreen() {
  const iconColors = useIconColors();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [sponsorMinutes, setSponsorMinutes] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editSponsorMinutes, setEditSponsorMinutes] = useState('');
  const [showAddAddiction, setShowAddAddiction] = useState(false);
  const [newAddictionName, setNewAddictionName] = useState('');

  const load = useCallback(async () => {
    const [p, a, m] = await Promise.all([
      getProfile(),
      getAddictions(),
      getSponsorWorkTimeMinutes(),
    ]);
    setProfile(p);
    setAddictions(a);
    setSponsorMinutes(m);
    setEditName(p.name);
    setEditBirthday(p.birthday ?? '');
    setEditSponsorMinutes(m != null ? String(m) : '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSaveProfile = async () => {
    if (!profile) return;
    const next: Profile = {
      ...profile,
      name: editName.trim(),
      birthday: editBirthday.trim() || null,
    };
    setProfile(next);
    await saveProfile(next);
  };

  const handleSaveSponsorTime = async () => {
    const n = parseInt(editSponsorMinutes, 10);
    if (isNaN(n) || n < 1) {
      await setSponsorWorkTimeMinutes(null);
      setSponsorMinutes(null);
      setEditSponsorMinutes('');
    } else {
      await setSponsorWorkTimeMinutes(n);
      setSponsorMinutes(n);
    }
  };

  const handleAddAddiction = async () => {
    const name = newAddictionName.trim();
    if (!name) return;
    const added = await addAddiction(name);
    setAddictions(await getAddictions());
    setNewAddictionName('');
    setShowAddAddiction(false);
  };

  const handleDeleteAddiction = (a: Addiction) => {
    Alert.alert('Remove addiction', `Remove "${a.name}"? This will not delete sobriety history.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteAddiction(a.id);
          setAddictions(await getAddictions());
        },
      },
    ]);
  };

  if (!profile) return null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-background">
      <AppHeader title="Profile" rightSlot={<ThemeToggle />} showBack />
      <PrivacyGate onCancel={() => router.back()}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
      >
        <View className="rounded-2xl p-4 bg-card border border-border">
          <Text className="text-base font-semibold text-foreground mb-2">Name</Text>
          <Text className="text-xs text-muted-foreground mb-2">
            Used for greetings (e.g. &quot;Good morning, {editName || 'Name'}&quot;)
          </Text>
          <TextInput
            value={editName}
            onChangeText={setEditName}
            onBlur={handleSaveProfile}
            placeholder="Your name"
            className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground"
          />
        </View>

        <View className="mt-4 rounded-2xl p-4 bg-card border border-border">
          <Text className="text-base font-semibold text-foreground mb-2">Birthday</Text>
          <Text className="text-xs text-muted-foreground mb-2">
            For birthday celebrations (optional)
          </Text>
          <TextInput
            value={editBirthday}
            onChangeText={setEditBirthday}
            onBlur={handleSaveProfile}
            placeholder="YYYY-MM-DD"
            className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground"
          />
        </View>

        <View className="mt-6 rounded-2xl p-4 bg-card border border-border">
          <Text className="text-base font-semibold text-foreground mb-2">Sponsor work time</Text>
          <Text className="text-xs text-muted-foreground mb-2">
            Daily target minutes (e.g. 60 for 1 hour). Used in Extra Tools and App Lock.
          </Text>
          <TextInput
            value={editSponsorMinutes}
            onChangeText={setEditSponsorMinutes}
            onBlur={handleSaveSponsorTime}
            placeholder="e.g. 60"
            keyboardType="number-pad"
            className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground"
          />
        </View>

        <View className="mt-6">
          <Text className="text-base font-semibold text-foreground mb-2">Addictions</Text>
          <Text className="text-xs text-muted-foreground mb-3">
            Track sobriety for each. Add as many as you need — we&apos;re all a little crazy.
          </Text>
          {addictions.map((a) => (
            <View
              key={a.id}
              className="flex-row items-center justify-between rounded-xl p-4 bg-card border border-border mb-2"
            >
              <Text className="text-base font-medium text-foreground">{a.name}</Text>
              <TouchableOpacity onPress={() => handleDeleteAddiction(a)} className="p-2">
                <Trash2 size={18} color={iconColors.destructive} />
              </TouchableOpacity>
            </View>
          ))}
          {showAddAddiction ? (
            <View className="rounded-xl p-4 bg-muted/50 border border-border">
              <TextInput
                value={newAddictionName}
                onChangeText={setNewAddictionName}
                placeholder="e.g. Alcohol, Nicotine"
                className="rounded-xl px-4 py-3 bg-muted border border-border text-foreground mb-2"
                autoFocus
              />
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => { setShowAddAddiction(false); setNewAddictionName(''); }}
                  className="flex-1 py-2 rounded-xl border border-border items-center"
                >
                  <Text className="text-foreground">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddAddiction}
                  className="flex-1 py-2 rounded-xl bg-primary items-center"
                >
                  <Text className="text-primary-foreground font-medium">Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowAddAddiction(true)}
              className="flex-row items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-muted"
            >
              <Plus size={20} color={iconColors.primary} />
              <Text className="text-primary font-medium">Add addiction</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      </PrivacyGate>
    </SafeAreaView>
  );
}
