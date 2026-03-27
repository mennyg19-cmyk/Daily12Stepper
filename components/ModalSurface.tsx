import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useThemeStyle } from '@/lib/ThemeContext';

const overlayOpacity = 0.5;

interface ModalSurfaceProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  position?: 'center' | 'bottom';
  animationType?: 'fade' | 'slide' | 'none';
  contentClassName?: string;
  keyboardAvoid?: boolean;
  noScroll?: boolean;
}

export function ModalSurface({
  visible,
  onRequestClose,
  children,
  position = 'center',
  animationType = 'fade',
  contentClassName = '',
  keyboardAvoid = true,
  noScroll = false,
}: ModalSurfaceProps) {
  const { themeStyle } = useThemeStyle();

  const contentWrapperStyle =
    position === 'bottom'
      ? [styles.contentBase, styles.contentBottom, { height: '85%' as `${number}%` }]
      : [styles.contentBase, styles.contentCenter];

  const handleOverlayPress = () => {
    Keyboard.dismiss();
    onRequestClose();
  };

  const scrollViewStyle = position === 'bottom' ? { flex: 1 } : undefined;
  const inner = noScroll ? children : (
    <ScrollView
      style={scrollViewStyle}
      showsVerticalScrollIndicator
      bounces={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}
    >
      {children}
    </ScrollView>
  );

  const contentStyle: StyleProp<ViewStyle> = position === 'bottom' ? [themeStyle, { flex: 1 }] : themeStyle;
  const content = (
    <View
      style={contentStyle}
      className={`bg-modal-content border border-modal-border rounded-2xl overflow-hidden ${contentClassName}`.trim()}
    >
      {inner}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onRequestClose}
    >
      <View style={[styles.overlay, position === 'bottom' && styles.overlayBottom]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleOverlayPress} />
        <View
          style={[
            contentWrapperStyle,
            position === 'bottom' && styles.contentBottomRadius,
          ]}
          pointerEvents="box-none"
        >
          {keyboardAvoid ? (
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={[styles.keyboardAvoid, position === 'bottom' && { flex: 1 }]}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                {content}
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          ) : (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              {content}
            </TouchableWithoutFeedback>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `rgba(0,0,0,${overlayOpacity})`,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayBottom: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  contentBase: {
    width: '100%',
    maxWidth: 480,
  },
  contentCenter: {
    alignSelf: 'center',
  },
  contentBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    margin: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  contentBottomRadius: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  keyboardAvoid: {
    width: '100%',
    maxWidth: 480,
  },
});
