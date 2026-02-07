"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

// most of the code is done by trae here....

type Option = {
  text: string;
  isCorrect: boolean;
};
type Question = {
  question: string;
  options: Option[];
};
type QuizFormData = {
  info: {
    title: string;
    description: string;
    questionCount: number;
    timeLimit: number;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    category: string;
  };
  questions: Question[];
};

const inputQuestionSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  options: z
    .array(
      z.object({
        text: z.string().min(1, "Option text is required"),
        isCorrect: z.boolean(),
      })
    )
    .min(2, "At least two options are required")
    .refine((opts) => opts.some((o) => o.isCorrect), {
      message: "At least one option must be marked correct",
    }),
});

const zodQuizFormDataSchema = z.object({
  info: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    questionCount: z.number().int().min(1, "At least one question is required"),
    timeLimit: z.number().int().min(1),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    category: z.string().min(1, "Category is required"),
  }),
  questions: z.array(inputQuestionSchema),
});

// Extracted component to keep hook order stable
function QuestionItem({
  qIndex,
  control,
  register,
  removeQuestion,
  errors,
}: {
  qIndex: number;
  control: any;
  register: any;
  removeQuestion: (index: number) => void;
  errors: any;
}) {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: `questions.${qIndex}.options` });

  return (
    <div className="border border-gray-300 p-3 rounded-md space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-lg font-bold">Question {qIndex + 1}</label>
        <button
          type="button"
          onClick={() => removeQuestion(qIndex)}
          className="text-sm text-red-600 underline"
        >
          Remove
        </button>
      </div>
      <input
        className="border-2 border-black px-2 py-1 w-full"
        {...register(`questions.${qIndex}.question`)}
        type="text"
        placeholder="Enter question text"
      />
      {errors.questions?.[qIndex]?.question && (
        <p className="text-red-600 text-sm">
          {errors.questions[qIndex].question.message}
        </p>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Options</h3>
          <button
            type="button"
            onClick={() => appendOption({ text: "", isCorrect: false })}
            className="text-sm text-blue-600 underline"
          >
            Add option
          </button>
        </div>
        {optionFields.map((opt, optIndex) => (
          <div key={opt.id} className="flex items-center gap-2 mt-2">
            <input
              className="border-2 border-black px-2 py-1 flex-1"
              {...register(`questions.${qIndex}.options.${optIndex}.text`)}
              type="text"
              placeholder={`Option ${optIndex + 1}`}
            />
            <label className="flex items-center gap-1">
              <input
                {...register(`questions.${qIndex}.options.${optIndex}.isCorrect`)}
                type="checkbox"
              />
              Correct
            </label>
            <button
              type="button"
              onClick={() => removeOption(optIndex)}
              className="text-sm text-red-600 underline"
            >
              Remove
            </button>
          </div>
        ))}
        {errors.questions?.[qIndex]?.options && (
          <p className="text-red-600 text-sm">
            {errors.questions[qIndex].options.message}
          </p>
        )}
      </div>
    </div>
  );
}

export default function QuizCreatePage() {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(zodQuizFormDataSchema),
    defaultValues: {
      info: {
        title: "",
        description: "",
        questionCount: 1,
        timeLimit: 1,
        difficulty: "EASY",
        category: "",
      },
      questions: [
        {
          question: "",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
        },
      ],
    },
    mode: "onChange",
  });

  const {
    fields: questionFields,
    append: appendQuestion,
    remove: removeQuestion,
  } = useFieldArray({ control, name: "questions" });

  const [questionCount, setQuestionCount] = useState(0);

  const onSubmit = (data: QuizFormData) => {
    console.log("Submitted data:", data);
    setQuestionCount(data.questions.length);
  };

  const onError = (err: any) => {
    console.log("Validation errors:", err);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit, onError)}
      className="border-2 border-black space-y-4 p-4"
      noValidate
    >
      <div className="text-2xl font-bold">Quiz Information</div>

      <div>
        <label className="text-lg font-bold block">Title</label>
        <input
          className="border-2 border-black px-2 py-1 w-full"
          {...register("info.title")}
          type="text"
        />
        {errors.info?.title && (
          <p className="text-red-600 text-sm">{errors.info.title.message}</p>
        )}
      </div>

      <div>
        <label className="text-lg font-bold block">Description</label>
        <input
          className="border-2 border-black px-2 py-1 w-full"
          {...register("info.description")}
          type="text"
        />
        {errors.info?.description && (
          <p className="text-red-600 text-sm">{errors.info.description.message}</p>
        )}
      </div>

      <div>
        <label className="text-lg font-bold block">Category</label>
        <input
          className="border-2 border-black px-2 py-1 w-full"
          {...register("info.category")}
          type="text"
        />
        {errors.info?.category && (
          <p className="text-red-600 text-sm">{errors.info.category.message}</p>
        )}
      </div>

      <div>
        <label className="text-lg font-bold block">Difficulty</label>
        <select
          className="border-2 border-black px-2 py-1 w-full"
          {...register("info.difficulty")}
        >
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>

      <div>
        <label className="text-lg font-bold block">Time Limit (minutes)</label>
        <input
          className="border-2 border-black px-2 py-1 w-full"
          {...register("info.timeLimit", { valueAsNumber: true })}
          type="number"
          min={1}
        />
        {errors.info?.timeLimit && (
          <p className="text-red-600 text-sm">{errors.info.timeLimit.message}</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold">Questions</h2>
        <button
          type="button"
          onClick={() =>
            appendQuestion({
              question: "",
              options: [
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
              ],
            })
          }
          className="text-blue-600 underline"
        >
          Add Question
        </button>
      </div>

      {questionFields.map((q, qIndex) => (
        <QuestionItem
          key={q.id}
          qIndex={qIndex}
          control={control}
          register={register}
          removeQuestion={removeQuestion}
          errors={errors}
        />
      ))}

      <button
        type="submit"
        disabled={!questionFields.length}
        className="bg-blue-200 text-blue-600 px-4 py-2 rounded-md hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save Quiz
      </button>
    </form>
  );
}
