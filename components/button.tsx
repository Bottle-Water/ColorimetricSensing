import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Pressable, StyleSheet } from "react-native";

export function Button({
  backgroundColor="#ffffff",
  borderColor="#000000", borderWidth=0,
  icon=faCircleDot, iconColor="#000000", iconScale=2/3,
  margin=0, size=50,
  onPress=()=>{},
}) {

  const styles = StyleSheet.create({
    button: {
      alignItems: "center",
      backgroundColor: backgroundColor,
      borderColor: borderColor,
      borderRadius: size / 2,
      borderWidth: borderWidth,
      height: size,
      justifyContent: "center",
      margin: margin,
      width: size,
    },
  });

  const iconSize = size * iconScale;

  return (
    <Pressable onPress={onPress} style={styles.button}>
      <FontAwesomeIcon color={iconColor} icon={icon} size={iconSize} />
    </Pressable>
  );
}
