import { act, render, screen, fireEvent } from "@testing-library/react-native";
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useTypewriter } from "./useTypewriter";

function Bubble({
  content,
  typing,
  skip,
  onDone,
}: {
  content: string;
  typing: boolean;
  skip: boolean;
  onDone: () => void;
}) {
  const { shown, done, skip: skipTyping } = useTypewriter(content, typing);
  useEffect(() => {
    if (typing && skip) skipTyping();
  }, [typing, skip]);
  useEffect(() => {
    if (typing && done) onDone();
  }, [typing, done]);
  return <Text>{shown}</Text>;
}

function Chat({ turns }: { turns: { text: string; suggestions: string[] }[] }) {
  const [messages, setMessages] = useState(["Pergunta 1"]);
  const [suggestions, setSuggestions] = useState(["3", "4"]);
  const [sending, setSending] = useState(false);
  const [turn, setTurn] = useState(0);
  const [typingIndex, setTypingIndex] = useState<number | null>(null);
  const [typingDone, setTypingDone] = useState(true);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [suggestions]);

  async function send(answer: string) {
    const next = [...messages, answer];
    setMessages(next);
    setSuggestions([]);
    setSending(true);

    const res = turns[turn];
    await Promise.resolve();

    setMessages([...next, res.text]);
    setTypingIndex(next.length);
    setTypingDone(false);
    setSuggestions(res.suggestions);
    setTurn(turn + 1);
    setSending(false);
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((m, i) => (
          <Bubble
            key={i}
            content={m}
            typing={i === typingIndex}
            skip={typingDone}
            onDone={() => setTypingDone(true)}
          />
        ))}
      </ScrollView>
      {typingDone && !sending && suggestions.length > 0 && (
        <View>
          {suggestions.map((s) => (
            <Pressable key={s} testID={`chip-${s}`} onPress={() => send(s)}>
              <Text>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const turns = [
  { text: "Há quanto tempo você treina?", suggestions: ["1 ano", "3 anos"] },
  { text: "Qual seu objetivo?", suggestions: ["hipertrofia", "força"] },
];

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ["setImmediate", "clearImmediate"] });
});
afterEach(() => jest.useRealTimers());

it("keeps showing suggestions past the first turn", async () => {
  await render(<Chat turns={turns} />);
  expect(screen.queryByTestId("chip-3")).not.toBeNull();

  await act(async () => {
    fireEvent.press(screen.getByTestId("chip-3"));
  });
  expect(screen.queryByTestId("chip-1 ano")).toBeNull();

  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(screen.queryByTestId("chip-1 ano")).not.toBeNull();

  await act(async () => {
    fireEvent.press(screen.getByTestId("chip-1 ano"));
  });
  await act(async () => {
    jest.advanceTimersByTime(1000);
  });
  expect(screen.queryByTestId("chip-hipertrofia")).not.toBeNull();
});
