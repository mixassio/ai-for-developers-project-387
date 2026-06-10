import "@typespec/http";

using TypeSpec.Http;

namespace CalendarOfCalls;

// ---------------------------------------------------------------------------
// Domain entities
// ---------------------------------------------------------------------------

@doc("""
  Владелец календаря. В системе нет регистрации и авторизации — это единственный
  заранее заданный профиль, который неявно используется во всех админских операциях.
  """)
model Owner {
  @doc("Уникальный идентификатор владельца.")
  @key
  id: string;

  @doc("Отображаемое имя владельца.")
  name: string;

  @doc("Контактный email владельца.")
  @format("email")
  email: string;

  @doc("Таймзона владельца в формате IANA, например `Europe/Moscow`.")
  timezone: string;
}

@doc("Тип события, который создаёт владелец. Длительность задаётся в минутах.")
model EventType {
  @doc("Уникальный идентификатор типа события.")
  @key
  @visibility(Lifecycle.Read)
  id: string;

  @doc("Название типа события.")
  @minLength(1)
  @maxLength(200)
  title: string;

  @doc("Описание типа события.")
  @maxLength(2000)
  description: string;

  @doc("Длительность встречи в минутах.")
  @minValue(1)
  @maxValue(1440)
  durationMinutes: int32;
}

@doc("Данные для создания нового типа события.")
model EventTypeCreate {
  @doc("Название типа события.")
  @minLength(1)
  @maxLength(200)
  title: string;

  @doc("Описание типа события.")
  @maxLength(2000)
  description: string;

  @doc("Длительность встречи в минутах.")
  @minValue(1)
  @maxValue(1440)
  durationMinutes: int32;
}

@doc("Данные для обновления существующего типа события.")
model EventTypeUpdate {
  @doc("Название типа события.")
  @minLength(1)
  @maxLength(200)
  title?: string;

  @doc("Описание типа события.")
  @maxLength(2000)
  description?: string;

  @doc("Длительность встречи в минутах.")
  @minValue(1)
  @maxValue(1440)
  durationMinutes?: int32;
}

@doc("""
  Публичное (гостевое) представление типа события. Содержит только данные,
  необходимые гостю для выбора: название, описание и длительность.
  """)
model PublicEventType {
  @doc("Уникальный идентификатор типа события.")
  id: string;

  @doc("Название типа события.")
  title: string;

  @doc("Описание типа события.")
  description: string;

  @doc("Длительность встречи в минутах.")
  durationMinutes: int32;
}

@doc("""
  Слот — вычисляемое окно времени в рамках 14-дневного окна записи.
  Слоты не хранятся как самостоятельный ресурс, а формируются на лету
  для конкретного типа события с учётом глобального правила занятости.
  """)
model Slot {
  @doc("Начало слота (UTC, ISO 8601).")
  start: utcDateTime;

  @doc("Конец слота (UTC, ISO 8601). Равен start + durationMinutes.")
  end: utcDateTime;

  @doc("Свободен ли слот. В выдаче свободных слотов всегда `true`.")
  available: boolean;
}

@doc("Бронирование, созданное гостем на конкретный слот.")
model Booking {
  @doc("Уникальный идентификатор бронирования.")
  @key
  id: string;

  @doc("Идентификатор типа события, на которое создано бронирование.")
  eventTypeId: string;

  @doc("Начало встречи (UTC, ISO 8601).")
  start: utcDateTime;

  @doc("Конец встречи (UTC, ISO 8601).")
  end: utcDateTime;

  @doc("Имя гостя.")
  guestName: string;

  @doc("Email гостя.")
  @format("email")
  guestEmail: string;

  @doc("Дополнительные заметки гостя к встрече.")
  notes?: string;

  @doc("Момент создания бронирования (UTC, ISO 8601).")
  createdAt: utcDateTime;
}

@doc("""
  Данные для создания бронирования гостем. Конец встречи (`end`) вычисляется
  сервером как `start + durationMinutes` соответствующего типа события.
  """)
model BookingCreate {
  @doc("Идентификатор выбранного типа события.")
  eventTypeId: string;

  @doc("Начало выбранного слота (UTC, ISO 8601). Должно совпадать с одним из свободных слотов в 14-дневном окне.")
  start: utcDateTime;

  @doc("Имя гостя.")
  @minLength(1)
  @maxLength(200)
  guestName: string;

  @doc("Email гостя.")
  @format("email")
  guestEmail: string;

  @doc("Дополнительные заметки гостя к встрече.")
  @maxLength(2000)
  notes?: string;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

@doc("Постраничная обёртка для коллекций.")
model Page<T> {
  @doc("Элементы текущей выборки.")
  items: T[];

  @doc("Общее количество элементов.")
  total: int32;
}

@doc("Тело ошибки в едином формате.")
model ErrorBody {
  @doc("Машиночитаемый код ошибки.")
  code: string;

  @doc("Человекочитаемое описание ошибки.")
  message: string;
}

@error
@doc("Ресурс не найден.")
model NotFoundError {
  @statusCode statusCode: 404;
  body: ErrorBody;
}

@error
@doc("Ошибка валидации входных данных (например, слот вне 14-дневного окна или не выровнен по длительности).")
model ValidationError {
  @statusCode statusCode: 422;
  body: ErrorBody;
}

@error
@doc("""
  Конфликт занятости: на выбранное время уже существует бронирование.
  Правило применяется глобально — даже если это разные типы событий.
  """)
model ConflictError {
  @statusCode statusCode: 409;
  body: ErrorBody;
}
