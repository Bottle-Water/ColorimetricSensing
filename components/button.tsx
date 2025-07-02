import { faCircleDot } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Pressable, StyleSheet } from "react-native";

export function Button({
  backgroundColor="#FFC904",
  borderColor="black", borderWidth=2,
  icon=faCircleDot, iconColor="black", iconScale=1/2,
  margin=0, size=40,
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
