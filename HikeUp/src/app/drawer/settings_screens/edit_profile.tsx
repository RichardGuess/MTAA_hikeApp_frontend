import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useTheme } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import { LOCAL_IP } from "../../../assets/constants";
import { router } from "expo-router";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  type ProfileField = "nickname" | "name" | "surname" | "email" | "profile_picture";

  const [form, setForm] = useState<Record<ProfileField, string>>({
    nickname: "",
    name: "",
    surname: "",
    email: "",
    profile_picture: "",
  });

  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth().currentUser;
        if (!user) throw new Error("User is not authenticated");

        const token = await user.getIdToken(true);

        const res = await fetch(`${LOCAL_IP}/api/users/search?email=${user.email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        const userData = data.body?.[0];

        if (!userData?.id) throw new Error("User ID not found in response");

        setUserId(userData.id);
        setForm({
          nickname: userData.nickname || '',
          name: userData.name || '',
          surname: userData.surname || '',
          email: userData.email || '',
          profile_picture: userData.profile_picture || '',
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (field: ProfileField, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!userId) return;

    try {
      const user = auth().currentUser;
      if (!user) throw new Error("User is not authenticated");

      const token = await user.getIdToken();

      // validate and update password if provided
      if (passwords.newPassword) {
        if (passwords.newPassword !== passwords.confirmPassword) {
          Alert.alert("Error", "Passwords do not match");
          return;
        }

        if (passwords.newPassword.length < 6) {
          Alert.alert("Error", "Password must be at least 6 characters");
          return;
        }

        try {
          await user.updatePassword(passwords.newPassword);
          console.log("Password updated successfully");
        } catch (err) {
          console.error("Failed to update password", err);
          Alert.alert("Error", "Failed to update password. You may need to re-authenticate.");
          return;
        }
      }

      // update profile info in local DB
      const res = await fetch(`${LOCAL_IP}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      Alert.alert("Success", "Profile updated!");

      setTimeout(() => {
        router.replace('../home_redirect');
      }, 1000);

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not update profile");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Edit Your Profile</Text>

      {(["nickname", "name", "surname", "email", "profile_picture"] as ProfileField[]).map(field => (
        <TextInput
          key={field}
          value={form[field]}
          placeholder={field}
          onChangeText={val => handleChange(field, val)}
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholderTextColor={colors.border}
        />
      ))}

      <TextInput
        value={passwords.newPassword}
        placeholder="New Password"
        onChangeText={val => setPasswords(prev => ({ ...prev, newPassword: val }))}
        secureTextEntry
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholderTextColor={colors.border}
      />
      <TextInput
        value={passwords.confirmPassword}
        placeholder="Confirm Password"
        onChangeText={val => setPasswords(prev => ({ ...prev, confirmPassword: val }))}
        secureTextEntry
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholderTextColor={colors.border}
      />

      <Button title="Save Changes" onPress={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  label: {
    fontSize: 20,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
});
