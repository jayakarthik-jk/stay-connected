import { useState } from "react";
import { Image, StyleSheet, TextInput, View } from "react-native";
import { useUser } from "../../Context/User";
import useDynamicColors from "../../Hooks/useDynamicColors";
import { colors } from "../../Util";
import Button from "../Common/Button";
import Http from "../../Services/Http";
import Labels from "../../Navigation/Labels";
import Touchable from "../Common/Touchable";
import Text from "../Common/Text";
import { useNavigation } from "@react-navigation/native";

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useUser();
  const { background, font } = useDynamicColors();

  const navigation = useNavigation();

  const handleLogin = async () => {
    const response = await Http.login(email, password);
    if (response instanceof Error) {
      return alert(response.message);
    }
    setUser(response);
  };
  return (
    <View style={[styles.container, background]}>
      <Image
        source={require("../../../assets/login.png")}
        resizeMode="contain"
        style={styles.backgroundImage}
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor={font.color}
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholderTextColor={font.color}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <Button onPress={handleLogin}>Login</Button>
      <Text style={styles.redirectText}>
        Don't have an account
        <Touchable
          noFeedback
          onPress={() => navigation.replace(Labels.REGISTER_SCREEN)}
        >
          <Text style={styles.redirectLink}>&nbsp;Register</Text>
        </Touchable>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  input: {
    height: 40,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.grey,
    marginBottom: 15,
  },
  backgroundImage: {
    width: "100%",
    height: 320,
  },
  redirectText: {
    color: colors.grey,
    textAlign: "center",
    padding: 10,
    marginTop: 20,
  },
  redirectLink: {
    color: colors.secondary,
  },
});

export default LoginScreen;
