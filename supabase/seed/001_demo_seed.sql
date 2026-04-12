-- Demo seed for local development.
-- Replace the UUIDs below with local auth.users ids if you want the rows to align with real sign-in accounts.

insert into public.profiles (id, email, full_name, display_name, role, user_type, grade_level, status)
values
  ('11111111-1111-1111-1111-111111111111', 'lin@economics.studio', 'Professor Lin', 'Prof. Lin', 'teacher', 'internal', null, 'active'),
  ('22222222-2222-2222-2222-222222222221', 'alice@student.local', 'Alice Zhang', 'Alice', 'student', 'internal', 'Grade 10', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'ben@student.local', 'Ben Wu', 'Ben', 'student', 'internal', 'Grade 11', 'active'),
  ('22222222-2222-2222-2222-222222222223', 'chloe@student.local', 'Chloe Sun', 'Chloe', 'student', 'internal', 'Grade 12', 'active'),
  ('22222222-2222-2222-2222-222222222224', 'dylan@student.local', 'Dylan He', 'Dylan', 'student', 'external', null, 'active')
on conflict (id) do nothing;

insert into public.teacher_profiles (profile_id, bio, subjects, is_founder)
values
  ('11111111-1111-1111-1111-111111111111', 'Founder and lead economics instructor focused on essays, case analysis, and exam technique.', array['Economics', 'Essay Writing'], true)
on conflict (profile_id) do nothing;

insert into public.student_profiles (profile_id, internal_student_code, school_name, notes_private)
values
  ('22222222-2222-2222-2222-222222222221', 'ECO-2401', 'West Lake Academy', 'Strong essay structure; needs faster diagram interpretation.'),
  ('22222222-2222-2222-2222-222222222222', 'ECO-2402', 'West Lake Academy', 'Reliable homework completion; watch time management.'),
  ('22222222-2222-2222-2222-222222222223', 'ECO-2403', 'Riverbridge College', 'Good analysis depth; needs cleaner evaluation endings.'),
  ('22222222-2222-2222-2222-222222222224', null, 'External Essay Service', 'External essay-feedback client for service workflows.')
on conflict (profile_id) do nothing;

insert into public.spaces (id, type, title, slug, description, academic_year, status, owner_id)
values
  ('33333333-3333-3333-3333-333333333331', 'class', 'IG Economics Foundations', 'ig-economics-foundations', 'Core class covering market systems, elasticity, and structured exam writing.', '2025-2026', 'published', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333332', 'class', 'A Level Essay Lab', 'a-level-essay-lab', 'Essay-focused class for higher-level economic reasoning, evaluation, and timed writing.', '2025-2026', 'published', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', 'elective', 'Policy Debate Studio', 'policy-debate-studio', 'Elective for policy argumentation, case framing, and rebuttal writing.', '2025-2026', 'published', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333334', 'elective', 'Data Commentary Workshop', 'data-commentary-workshop', 'Elective exploring data response technique, chart commentary, and short-form evaluation.', '2025-2026', 'draft', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into public.space_memberships (space_id, profile_id, membership_role, status)
values
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'teacher', 'active'),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'teacher', 'active'),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'teacher', 'active'),
  ('33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-111111111111', 'teacher', 'active'),
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', 'student', 'active'),
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222', 'student', 'active'),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222223', 'student', 'active'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222221', 'student', 'active'),
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'student', 'pending')
on conflict (space_id, profile_id) do nothing;

insert into public.space_sections (id, space_id, title, slug, type, sort_order, description)
values
  ('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333331', 'Market Structure', 'market-structure', 'chapter', 1, 'Perfect competition, monopoly, and contestability.'),
  ('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333331', 'Elasticity Revision', 'elasticity-revision', 'module', 2, 'Price, income, and cross elasticity review.'),
  ('44444444-4444-4444-4444-444444444443', '33333333-3333-3333-3333-333333333331', 'Essay Writing Clinic', 'essay-writing-clinic', 'week', 3, 'Planning and evaluation drills.'),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333332', 'Evaluation Frameworks', 'evaluation-frameworks', 'module', 1, 'Train balanced argument structures.'),
  ('44444444-4444-4444-4444-444444444445', '33333333-3333-3333-3333-333333333332', 'Timed Essay Practice', 'timed-essay-practice', 'week', 2, 'Timed response sets and reflection.')
on conflict (id) do nothing;

insert into public.resources (id, space_id, section_id, title, slug, description, resource_type, status, visibility, created_by, updated_by, published_at, sort_order)
values
  ('55555555-5555-5555-5555-555555555551', '33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444441', 'Market Structure Chapter Slides', 'market-structure-slides', 'Slide deck introducing monopoly, monopolistic competition, and perfect competition.', 'ppt', 'published', 'space', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', timezone('utc', now()), 1),
  ('55555555-5555-5555-5555-555555555552', '33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444442', 'Elasticity Revision Checklist', 'elasticity-revision-checklist', 'Quick revision checklist for elasticity formulas and interpretation.', 'revision', 'published', 'space', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', timezone('utc', now()), 2),
  ('55555555-5555-5555-5555-555555555553', '33333333-3333-3333-3333-333333333332', '44444444-4444-4444-4444-444444444444', 'Essay Writing Checklist', 'essay-writing-checklist', 'A concise structure checklist for argument, evidence, analysis, and evaluation.', 'worksheet', 'published', 'space', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', timezone('utc', now()), 1),
  ('55555555-5555-5555-5555-555555555554', '33333333-3333-3333-3333-333333333332', '44444444-4444-4444-4444-444444444445', 'Macro Policy Mock Paper', 'macro-policy-mock-paper', 'Timed mock paper on inflation control and fiscal trade-offs.', 'mock_paper', 'draft', 'selected_members', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', null, 2)
on conflict (id) do nothing;

insert into public.resource_files (resource_id, file_path, file_name, file_ext, mime_type, file_size, preview_url, sort_order)
values
  ('55555555-5555-5555-5555-555555555551', 'resource-files/ig-economics-foundations/market-structure-slides.pdf', 'market-structure-slides.pdf', 'pdf', 'application/pdf', 1240032, null, 1),
  ('55555555-5555-5555-5555-555555555552', 'resource-files/ig-economics-foundations/elasticity-revision-checklist.pdf', 'elasticity-revision-checklist.pdf', 'pdf', 'application/pdf', 248112, null, 1),
  ('55555555-5555-5555-5555-555555555553', 'resource-files/a-level-essay-lab/essay-writing-checklist.docx', 'essay-writing-checklist.docx', 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 87444, null, 1)
on conflict do nothing;

insert into public.notices (space_id, title, body, notice_type, publish_at, expire_at, is_pinned, status, created_by, updated_by)
values
  ('33333333-3333-3333-3333-333333333331', 'Mock exam notice', 'Our market structure mock exam will be held next Wednesday. Review the monopoly diagrams before class.', 'mock_exam', timezone('utc', now()), null, true, 'published', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333331', 'Elasticity deadline reminder', 'Please complete the elasticity revision checklist before Friday 20:00.', 'deadline', timezone('utc', now()), null, false, 'published', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333332', 'Essay plan homework', 'Submit one evaluated outline on trade protection before the weekend tutorial.', 'homework', timezone('utc', now()), null, false, 'published', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111')
on conflict do nothing;

insert into public.exercise_sets (id, space_id, section_id, title, slug, exercise_type, instructions, status, created_by, updated_by)
values
  ('77777777-7777-7777-7777-777777777771', '33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444442', 'Elasticity Quick Check', 'elasticity-quick-check', 'mcq', 'Work through each multiple-choice item carefully, then review the explanation before moving on.', 'published', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('77777777-7777-7777-7777-777777777772', '33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444442', 'Elasticity Term Recall', 'elasticity-term-recall', 'term_recall', 'Type the full term where possible. Answers are checked case-insensitively after trimming spacing.', 'published', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111'),
  ('77777777-7777-7777-7777-777777777773', '33333333-3333-3333-3333-333333333331', '44444444-4444-4444-4444-444444444441', 'Market Structure Flashcards', 'market-structure-flashcards', 'flashcard', 'Flip each card, self-check your recall, and mark whether the concept still needs review.', 'published', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

insert into public.exercise_items (id, exercise_set_id, prompt, prompt_rich, item_type, answer_key_json, explanation, sort_order, difficulty, tags_json)
values
  ('88888888-8888-8888-8888-888888888811', '77777777-7777-7777-7777-777777777771', 'A good with negative income elasticity of demand is best described as:', null, 'mcq', '{"options":[{"id":"A","label":"A luxury good"},{"id":"B","label":"An inferior good"},{"id":"C","label":"A public good"},{"id":"D","label":"A merit good"}],"correctOptionId":"B"}'::jsonb, 'Inferior goods see demand fall as income rises, so YED is negative.', 1, 'foundation', '["elasticity","income elasticity"]'::jsonb),
  ('88888888-8888-8888-8888-888888888812', '77777777-7777-7777-7777-777777777771', 'If the price elasticity of demand is -2.4, demand is:', null, 'mcq', '{"options":[{"id":"A","label":"Perfectly inelastic"},{"id":"B","label":"Relatively inelastic"},{"id":"C","label":"Relatively elastic"},{"id":"D","label":"Unit elastic"}],"correctOptionId":"C"}'::jsonb, 'The magnitude is greater than 1, so demand is relatively elastic.', 2, 'foundation', '["ped"]'::jsonb),
  ('88888888-8888-8888-8888-888888888813', '77777777-7777-7777-7777-777777777771', 'Two goods are complements when cross elasticity of demand is:', null, 'mcq', '{"options":[{"id":"A","label":"Positive"},{"id":"B","label":"Negative"},{"id":"C","label":"Zero"},{"id":"D","label":"Exactly one"}],"correctOptionId":"B"}'::jsonb, 'Complementary goods move together in consumption, so a rise in one price lowers demand for the other.', 3, 'standard', '["xed"]'::jsonb),
  ('88888888-8888-8888-8888-888888888814', '77777777-7777-7777-7777-777777777771', 'Demand tends to be more price elastic when:', null, 'mcq', '{"options":[{"id":"A","label":"There are few substitutes"},{"id":"B","label":"The good is a necessity with low budget share"},{"id":"C","label":"Consumers have more time to adjust"},{"id":"D","label":"The good is addictive"}],"correctOptionId":"C"}'::jsonb, 'Over time, consumers can search for substitutes and change habits, raising PED.', 4, 'standard', '["ped determinants"]'::jsonb),
  ('88888888-8888-8888-8888-888888888815', '77777777-7777-7777-7777-777777777771', 'A rise in demand for branded sportswear after an increase in incomes suggests the good is likely:', null, 'mcq', '{"options":[{"id":"A","label":"Inferior"},{"id":"B","label":"Complementary"},{"id":"C","label":"Normal"},{"id":"D","label":"Giffen"}],"correctOptionId":"C"}'::jsonb, 'Normal goods have positive income elasticity of demand.', 5, 'foundation', '["yed"]'::jsonb),
  ('88888888-8888-8888-8888-888888888816', '77777777-7777-7777-7777-777777777771', 'Which statement best explains why necessities tend to have inelastic demand?', null, 'mcq', '{"options":[{"id":"A","label":"Consumers can easily delay all purchases"},{"id":"B","label":"Consumers still need to buy them despite price changes"},{"id":"C","label":"Their supply is fixed"},{"id":"D","label":"They are always inferior goods"}],"correctOptionId":"B"}'::jsonb, 'When a product is necessary, quantity demanded changes by a smaller proportion than price.', 6, 'foundation', '["ped"]'::jsonb),
  ('88888888-8888-8888-8888-888888888821', '77777777-7777-7777-7777-777777777772', 'What does PED stand for?', null, 'spelling', '{"acceptedAnswers":["price elasticity of demand","ped"]}'::jsonb, 'PED is the standard abbreviation for price elasticity of demand.', 1, 'foundation', '["ped"]'::jsonb),
  ('88888888-8888-8888-8888-888888888822', '77777777-7777-7777-7777-777777777772', 'What does YED stand for?', null, 'spelling', '{"acceptedAnswers":["income elasticity of demand","yed"]}'::jsonb, 'YED tracks the responsiveness of demand to income changes.', 2, 'foundation', '["yed"]'::jsonb),
  ('88888888-8888-8888-8888-888888888823', '77777777-7777-7777-7777-777777777772', 'What does XED stand for?', null, 'spelling', '{"acceptedAnswers":["cross elasticity of demand","xed"]}'::jsonb, 'XED measures how the demand for one good changes when the price of another changes.', 3, 'foundation', '["xed"]'::jsonb),
  ('88888888-8888-8888-8888-888888888824', '77777777-7777-7777-7777-777777777772', 'Which elasticity term is used for substitutes and complements?', null, 'spelling', '{"acceptedAnswers":["cross elasticity of demand","xed"]}'::jsonb, 'Substitutes and complements are analyzed with cross elasticity of demand.', 4, 'standard', '["xed"]'::jsonb),
  ('88888888-8888-8888-8888-888888888825', '77777777-7777-7777-7777-777777777772', 'What is the term for demand that changes by a larger percentage than price?', null, 'spelling', '{"acceptedAnswers":["elastic demand","relatively elastic demand"]}'::jsonb, 'Elastic demand means quantity demanded responds more than proportionately to price change.', 5, 'standard', '["ped"]'::jsonb),
  ('88888888-8888-8888-8888-888888888826', '77777777-7777-7777-7777-777777777772', 'What is the term for a good with positive income elasticity of demand?', null, 'spelling', '{"acceptedAnswers":["normal good","a normal good"]}'::jsonb, 'Normal goods have positive YED because demand rises as income rises.', 6, 'foundation', '["yed"]'::jsonb),
  ('88888888-8888-8888-8888-888888888831', '77777777-7777-7777-7777-777777777773', 'Define price elasticity of demand.', null, 'flashcard', '{"front":"Define price elasticity of demand.","back":"The responsiveness of quantity demanded to a change in price."}'::jsonb, 'Use this as your anchor definition before comparing elastic and inelastic cases.', 1, 'foundation', '["ped"]'::jsonb),
  ('88888888-8888-8888-8888-888888888832', '77777777-7777-7777-7777-777777777773', 'What is a barrier to entry?', null, 'flashcard', '{"front":"What is a barrier to entry?","back":"A factor that makes it difficult or costly for new firms to enter an industry."}'::jsonb, 'This idea helps distinguish monopoly and oligopoly from more contestable markets.', 2, 'foundation', '["market structure"]'::jsonb),
  ('88888888-8888-8888-8888-888888888833', '77777777-7777-7777-7777-777777777773', 'State one characteristic of perfect competition.', null, 'flashcard', '{"front":"State one characteristic of perfect competition.","back":"Many small firms, homogeneous products, no barriers to entry, and perfect information are standard features."}'::jsonb, 'Any one correct characteristic is enough for initial recall.', 3, 'foundation', '["market structure"]'::jsonb),
  ('88888888-8888-8888-8888-888888888834', '77777777-7777-7777-7777-777777777773', 'What is product differentiation?', null, 'flashcard', '{"front":"What is product differentiation?","back":"Making a product appear distinct from rivals through branding, features, design, or service."}'::jsonb, 'Useful when comparing monopolistic competition with perfect competition.', 4, 'standard', '["market structure"]'::jsonb),
  ('88888888-8888-8888-8888-888888888835', '77777777-7777-7777-7777-777777777773', 'What is the key idea of contestability?', null, 'flashcard', '{"front":"What is the key idea of contestability?","back":"A market can behave competitively if entry and exit are easy, even when few firms are present."}'::jsonb, 'Contestability focuses on the threat of entry, not only the number of firms.', 5, 'standard', '["contestability"]'::jsonb),
  ('88888888-8888-8888-8888-888888888836', '77777777-7777-7777-7777-777777777773', 'What is one reason monopoly may persist?', null, 'flashcard', '{"front":"What is one reason monopoly may persist?","back":"Strong barriers to entry such as legal protection, high sunk costs, or control of key inputs can protect monopoly power."}'::jsonb, 'Use this when linking monopoly power to long-run market outcomes.', 6, 'standard', '["monopoly"]'::jsonb)
on conflict (id) do nothing;

insert into public.exercise_attempts (id, exercise_set_id, item_id, profile_id, submitted_answer_json, is_correct, score, attempt_no, attempted_at)
values
  ('99999999-9999-9999-9999-999999999911', '77777777-7777-7777-7777-777777777771', '88888888-8888-8888-8888-888888888811', '22222222-2222-2222-2222-222222222221', '{"selectedOptionId":"A"}'::jsonb, false, 0, 1, '2025-09-20T10:00:00.000Z'),
  ('99999999-9999-9999-9999-999999999912', '77777777-7777-7777-7777-777777777771', '88888888-8888-8888-8888-888888888812', '22222222-2222-2222-2222-222222222221', '{"selectedOptionId":"C"}'::jsonb, true, 1, 1, '2025-09-20T10:02:00.000Z'),
  ('99999999-9999-9999-9999-999999999913', '77777777-7777-7777-7777-777777777772', '88888888-8888-8888-8888-888888888821', '22222222-2222-2222-2222-222222222221', '{"text":"price elasticity"}'::jsonb, false, 0, 1, '2025-09-20T10:05:00.000Z'),
  ('99999999-9999-9999-9999-999999999914', '77777777-7777-7777-7777-777777777772', '88888888-8888-8888-8888-888888888822', '22222222-2222-2222-2222-222222222221', '{"text":"income elasticity of demand"}'::jsonb, true, 1, 1, '2025-09-20T10:06:00.000Z'),
  ('99999999-9999-9999-9999-999999999915', '77777777-7777-7777-7777-777777777771', '88888888-8888-8888-8888-888888888813', '22222222-2222-2222-2222-222222222221', '{"selectedOptionId":"A"}'::jsonb, false, 0, 1, '2025-09-20T10:08:00.000Z'),
  ('99999999-9999-9999-9999-999999999916', '77777777-7777-7777-7777-777777777771', '88888888-8888-8888-8888-888888888813', '22222222-2222-2222-2222-222222222221', '{"selectedOptionId":"B"}'::jsonb, true, 1, 2, '2025-09-21T09:00:00.000Z')
on conflict (id) do nothing;

insert into public.wrong_book_items (id, profile_id, source_type, source_id, latest_attempt_id, first_wrong_at, latest_wrong_at, mastered_at, status)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222221', 'exercise_item', '88888888-8888-8888-8888-888888888811', '99999999-9999-9999-9999-999999999911', '2025-09-20T10:00:00.000Z', '2025-09-20T10:00:00.000Z', null, 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222221', 'exercise_item', '88888888-8888-8888-8888-888888888821', '99999999-9999-9999-9999-999999999913', '2025-09-20T10:05:00.000Z', '2025-09-20T10:05:00.000Z', null, 'active'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '22222222-2222-2222-2222-222222222221', 'exercise_item', '88888888-8888-8888-8888-888888888813', '99999999-9999-9999-9999-999999999916', '2025-09-20T10:08:00.000Z', '2025-09-20T10:08:00.000Z', '2025-09-21T09:00:00.000Z', 'mastered')
on conflict (profile_id, source_type, source_id) do nothing;
