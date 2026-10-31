<select
  className="model-select"
  value={selectedModel}
  onChange={e => setSelectedModel(e.target.value)}
  aria-label={isArabic ? 'اختيار نموذج الذكاء الاصطناعي' : 'Choose AI model'}
>
  <option value="auto">{isArabic ? 'تلقائي' : 'Auto'}</option>
  {models.filter(model => model.online).map(model => (
    <option key={model.id} value={model.id}>
      {model.name}
    </option>
  ))}
</select>
